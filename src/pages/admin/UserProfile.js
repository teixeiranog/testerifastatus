import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Ticket,
  Trophy,
  Award,
  Eye,
  ExternalLink,
  Users as UsersIcon,
  Shield,
  ShieldCheck,
  CheckCircle,
  XCircle,
  MapPin,
  Clock
} from 'lucide-react';
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  doc, 
  getDoc,
  orderBy 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loading from '../../components/ui/Loading';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [rifasParticipadas, setRifasParticipadas] = useState([]);
  const [numerosComprados, setNumerosComprados] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('perfil');

  useEffect(() => {
    if (userId) {
      carregarDadosUsuario();
    }
  }, [userId]);

  const carregarDadosUsuario = async () => {
    try {
      setLoading(true);
      
      // Carregar dados do usuário
      const userDoc = await getDoc(doc(db, 'usuarios', userId));
      if (!userDoc.exists()) {
        toast.error('Usuário não encontrado');
        navigate('/admin/usuarios');
        return;
      }
      
      const userData = {
        id: userDoc.id,
        ...userDoc.data()
      };
      setUsuario(userData);

      // Carregar pedidos do usuário
      const pedidosQuery = query(
        collection(db, 'pedidos'),
        where('id_usuario', '==', userId),
        orderBy('data_criacao', 'desc')
      );
      const pedidosSnapshot = await getDocs(pedidosQuery);
      const pedidosData = pedidosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPedidos(pedidosData);

      // Carregar números comprados pelo usuário
      const numerosQuery = query(
        collection(db, 'numeros'),
        where('id_usuario', '==', userId),
        where('status', '==', 'vendido')
      );
      const numerosSnapshot = await getDocs(numerosQuery);
      const numerosData = numerosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNumerosComprados(numerosData);

      // Carregar rifas que o usuário participou
      const rifasIds = [...new Set(numerosData.map(num => num.id_rifa))];
      console.log('🔍 IDs das rifas:', rifasIds);
      const rifasData = [];
      
      for (const rifaId of rifasIds) {
        console.log('🔍 Carregando rifa:', rifaId);
        const rifaDoc = await getDoc(doc(db, 'rifas', rifaId));
        if (rifaDoc.exists()) {
          const rifaData = {
            id: rifaDoc.id,
            ...rifaDoc.data(),
            numerosUsuario: numerosData.filter(num => num.id_rifa === rifaId)
          };
          rifasData.push(rifaData);
          console.log('✅ Rifa carregada:', rifaData.titulo);
        } else {
          console.log('❌ Rifa não encontrada:', rifaId);
        }
      }
      
      console.log('✅ Rifas encontradas:', rifasData.length);
      console.log('📋 Rifas:', rifasData);
      setRifasParticipadas(rifasData);
      
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      toast.error('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data) => {
    if (!data) return 'N/A';
    const dataObj = data.toDate ? data.toDate() : new Date(data);
    return format(dataObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const calcularEstatisticas = () => {
    const totalGasto = pedidos
      .filter(pedido => pedido.status_pagamento === 'pago')
      .reduce((sum, pedido) => sum + (pedido.valor_total || 0), 0);
    
    const totalNumeros = numerosComprados.length;
    const totalRifas = rifasParticipadas.length;
    const pedidosPagos = pedidos.filter(p => p.status_pagamento === 'pago').length;
    const pedidosPendentes = pedidos.filter(p => p.status_pagamento === 'pendente').length;

    return {
      totalGasto,
      totalNumeros,
      totalRifas,
      pedidosPagos,
      pedidosPendentes
    };
  };

  const estatisticas = calcularEstatisticas();

  if (loading) {
    return <Loading text="Carregando perfil do usuário..." />;
  }

  if (!usuario) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Usuário não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/usuarios')}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Perfil do Usuário
            </h1>
            <p className="text-gray-600">
              Detalhes completos e histórico de participações
            </p>
          </div>
        </div>
      </div>

      {/* Informações do Usuário */}
      <Card>
        <div className="flex items-start space-x-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary-600 font-bold text-2xl">
              {usuario.nome?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {usuario.nome || 'Nome não informado'}
              </h2>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                usuario.ativo 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {usuario.ativo ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ativo
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Inativo
                  </>
                )}
              </span>
              
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                usuario.tipo === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {usuario.tipo === 'admin' ? (
                  <>
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Admin
                  </>
                ) : (
                  <>
                    <UsersIcon className="w-3 h-3 mr-1" />
                    Usuário
                  </>
                )}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{usuario.email}</span>
              </div>
              
              {usuario.telefone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{usuario.telefone}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  Cadastro: {formatarData(usuario.data_criacao)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 font-medium">
                  Total: {formatarValor(estatisticas.totalGasto)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-200" />
            <p className="text-2xl font-bold">{formatarValor(estatisticas.totalGasto)}</p>
            <p className="text-blue-100 text-sm">Total Gasto</p>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="text-center">
            <Ticket className="w-8 h-8 mx-auto mb-2 text-green-200" />
            <p className="text-2xl font-bold">{estatisticas.totalNumeros}</p>
            <p className="text-green-100 text-sm">Números Comprados</p>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-purple-200" />
            <p className="text-2xl font-bold">{estatisticas.totalRifas}</p>
            <p className="text-purple-100 text-sm">Rifas Participadas</p>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-orange-200" />
            <p className="text-2xl font-bold">{estatisticas.pedidosPagos}</p>
            <p className="text-orange-100 text-sm">Pedidos Pagos</p>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <div className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-200" />
            <p className="text-2xl font-bold">{estatisticas.pedidosPendentes}</p>
            <p className="text-yellow-100 text-sm">Pedidos Pendentes</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'perfil', name: 'Perfil', icon: User },
              { id: 'rifas', name: 'Rifas Participadas', icon: Trophy },
              { id: 'pedidos', name: 'Histórico de Pedidos', icon: Ticket }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {/* Tab: Perfil */}
          {activeTab === 'perfil' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Pessoais</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                      <p className="text-gray-900">{usuario.nome || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{usuario.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Telefone</label>
                      <p className="text-gray-900">{usuario.telefone || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Data de Cadastro</label>
                      <p className="text-gray-900">{formatarData(usuario.data_criacao)}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Status da Conta</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <p className={`font-medium ${usuario.ativo ? 'text-green-600' : 'text-red-600'}`}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tipo de Usuário</label>
                      <p className="text-gray-900 capitalize">{usuario.tipo || 'usuario'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Última Atualização</label>
                      <p className="text-gray-900">
                        {usuario.data_atualizacao ? formatarData(usuario.data_atualizacao) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Rifas Participadas */}
          {activeTab === 'rifas' && (
            <div className="space-y-6">
              {rifasParticipadas.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Este usuário ainda não participou de nenhuma rifa</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rifasParticipadas.map((rifa) => (
                    <motion.div
                      key={rifa.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{rifa.titulo}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              rifa.status === 'ativa' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {rifa.status === 'ativa' ? 'Ativa' : 'Finalizada'}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-3">{rifa.descricao}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Valor por número:</span>
                              <p className="font-medium">{formatarValor(rifa.valor)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Números comprados:</span>
                              <p className="font-medium">{rifa.numerosUsuario.length}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Total gasto:</span>
                              <p className="font-medium">
                                {formatarValor(rifa.valor * rifa.numerosUsuario.length)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Data do sorteio:</span>
                              <p className="font-medium">
                                {rifa.data_sorteio ? formatarData(rifa.data_sorteio) : 'N/A'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Números comprados */}
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Números comprados:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {rifa.numerosUsuario.map((numero) => (
                                <span
                                  key={numero.id}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                                >
                                  {numero.numero}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/rifa/${rifa.id}`)}
                          className="flex items-center"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Ver Rifa
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Histórico de Pedidos */}
          {activeTab === 'pedidos' && (
            <div className="space-y-6">
              {pedidos.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum pedido encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">ID do Pedido</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Rifa</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Números</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Valor</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidos.map((pedido) => (
                        <motion.tr
                          key={pedido.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-4 px-4 text-sm font-medium text-gray-900">
                            {pedido.id.slice(-8)}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {rifasParticipadas.find(r => r.id === pedido.id_rifa)?.titulo || 'N/A'}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1">
                              {pedido.numeros?.slice(0, 3).map((numero) => (
                                <span
                                  key={numero}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                                >
                                  {numero}
                                </span>
                              ))}
                              {pedido.numeros?.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{pedido.numeros.length - 3} mais
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm font-medium text-gray-900">
                            {formatarValor(pedido.valor_total)}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              pedido.status_pagamento === 'pago'
                                ? 'bg-green-100 text-green-800'
                                : pedido.status_pagamento === 'pendente'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {pedido.status_pagamento === 'pago' ? 'Pago' : 
                               pedido.status_pagamento === 'pendente' ? 'Pendente' : 'Expirado'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {formatarData(pedido.data_criacao)}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UserProfile;
