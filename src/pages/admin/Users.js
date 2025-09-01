import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users as UsersIcon,
  Search,
  Filter,
  Download,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Trophy,
  MoreVertical
} from 'lucide-react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc,
  limit,
  startAfter,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loading from '../../components/ui/Loading';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Users = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [ordenacao, setOrdenacao] = useState('recente');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [modalEdicao, setModalEdicao] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [estatisticas, setEstatisticas] = useState(null);

  const USUARIOS_POR_PAGINA = 20;
  const navigate = useNavigate();

  useEffect(() => {
    carregarUsuarios();
    carregarEstatisticas();
  }, [paginaAtual, ordenacao, filtroStatus, filtroTipo]);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      
      let q = query(collection(db, 'usuarios'));
      
      // Aplicar filtros
      if (filtroStatus !== 'todos') {
        q = query(q, where('ativo', '==', filtroStatus === 'ativo'));
      }
      
      if (filtroTipo !== 'todos') {
        q = query(q, where('tipo_usuario', '==', filtroTipo));
      }
      
      // Aplicar ordenação
      switch (ordenacao) {
        case 'recente':
          q = query(q, orderBy('data_criacao', 'desc'));
          break;
        case 'nome':
          q = query(q, orderBy('nome', 'asc'));
          break;
        case 'email':
          q = query(q, orderBy('email', 'asc'));
          break;
        default:
          q = query(q, orderBy('data_criacao', 'desc'));
      }
      
      // Paginação
      q = query(q, limit(USUARIOS_POR_PAGINA));
      
      const snapshot = await getDocs(q);
      const usuariosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsuarios(usuariosData);
      
      // Contar total de usuários
      const countSnapshot = await getCountFromServer(collection(db, 'usuarios'));
      setTotalUsuarios(countSnapshot.data().count);
      
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      // Estatísticas gerais
      const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
      const pedidosSnapshot = await getDocs(collection(db, 'pedidos'));
      
      const usuariosAtivos = usuariosSnapshot.docs.filter(doc => doc.data().ativo).length;
      const usuariosInativos = usuariosSnapshot.docs.length - usuariosAtivos;
      const admins = usuariosSnapshot.docs.filter(doc => doc.data().tipo_usuario === 'admin').length;
      
      // Calcular gastos por usuário
      const gastosPorUsuario = {};
      pedidosSnapshot.docs.forEach(doc => {
        const pedido = doc.data();
        if (pedido.status_pagamento === 'pago') {
          gastosPorUsuario[pedido.id_usuario] = (gastosPorUsuario[pedido.id_usuario] || 0) + (pedido.valor_total || 0);
        }
      });
      
      const totalGastos = Object.values(gastosPorUsuario).reduce((sum, valor) => sum + valor, 0);
      const mediaGastos = totalGastos / Object.keys(gastosPorUsuario).length || 0;
      
      setEstatisticas({
        total: usuariosSnapshot.docs.length,
        ativos: usuariosAtivos,
        inativos: usuariosInativos,
        admins,
        totalGastos,
        mediaGastos,
        gastosPorUsuario
      });
      
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const alterarStatusUsuario = async (usuarioId, novoStatus) => {
    try {
      await updateDoc(doc(db, 'usuarios', usuarioId), {
        ativo: novoStatus,
        data_atualizacao: new Date()
      });
      
      toast.success(`Usuário ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
      carregarUsuarios();
      
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const alterarTipoUsuario = async (usuarioId, novoTipo) => {
    try {
      await updateDoc(doc(db, 'usuarios', usuarioId), {
        tipo_usuario: novoTipo,
        data_atualizacao: new Date()
      });
      
      toast.success(`Tipo de usuário alterado para ${novoTipo}!`);
      carregarUsuarios();
      
    } catch (error) {
      console.error('Erro ao alterar tipo:', error);
      toast.error('Erro ao alterar tipo do usuário');
    }
  };

  const excluirUsuario = async (usuarioId) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'usuarios', usuarioId));
      toast.success('Usuário excluído com sucesso!');
      carregarUsuarios();
      
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const formatarData = (data) => {
    if (!data) return 'N/A';
    const dataObj = data.toDate ? data.toDate() : new Date(data);
    return format(dataObj, "dd/MM/yyyy", { locale: ptBR });
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      return (
        usuario.nome?.toLowerCase().includes(termo) ||
        usuario.email?.toLowerCase().includes(termo) ||
        usuario.telefone?.includes(termo)
      );
    }
    return true;
  });

  const totalPaginas = Math.ceil(totalUsuarios / USUARIOS_POR_PAGINA);

  return (
    <div className="space-y-6 overflow-x-hidden max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerenciamento de Usuários
          </h1>
          <p className="text-gray-600">
            Gerencie todos os usuários da plataforma
          </p>
        </div>
        
        <div className="flex space-x-3 mt-4 md:mt-0">
          <Button variant="outline" className="flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button className="flex items-center">
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total de Usuários</p>
                <p className="text-2xl font-bold">{estatisticas.total}</p>
              </div>
              <UsersIcon className="w-10 h-10 text-blue-200" />
            </div>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Usuários Ativos</p>
                <p className="text-2xl font-bold">{estatisticas.ativos}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-200" />
            </div>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Administradores</p>
                <p className="text-2xl font-bold">{estatisticas.admins}</p>
              </div>
              <Shield className="w-10 h-10 text-purple-200" />
            </div>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Receita Total</p>
                <p className="text-2xl font-bold">{formatarValor(estatisticas.totalGastos)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-orange-200" />
            </div>
          </Card>
        </div>
      )}

      {/* Filtros e Busca */}
      <Card>
        <div className="space-y-4">
          {/* Barra de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-4">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
            
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="usuario">Usuários</option>
              <option value="admin">Administradores</option>
            </select>
            
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="recente">Mais Recente</option>
              <option value="nome">Nome A-Z</option>
              <option value="email">Email A-Z</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de Usuários */}
      {loading ? (
        <Loading text="Carregando usuários..." />
      ) : (
        <Card>
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Usuário</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Cadastro</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Gastos</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((usuario, index) => (
                    <motion.tr
                      key={usuario.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-primary-600 font-medium">
                              {usuario.nome?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{usuario.nome || 'Nome não informado'}</div>
                            <div className="text-sm text-gray-500">{usuario.email}</div>
                            {usuario.telefone && (
                              <div className="text-xs text-gray-400">{usuario.telefone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-4">
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
                      </td>
                      
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          usuario.tipo_usuario === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {usuario.tipo_usuario === 'admin' ? (
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
                      </td>
                      
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {formatarData(usuario.data_criacao)}
                      </td>
                      
                      <td className="py-4 px-4 text-sm font-medium text-gray-900">
                        {formatarValor(estatisticas?.gastosPorUsuario[usuario.id] || 0)}
                      </td>
                      
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/usuarios/${usuario.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUsuarioSelecionado(usuario);
                              setModalEdicao(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant={usuario.ativo ? "outline" : "primary"}
                            size="sm"
                            onClick={() => alterarStatusUsuario(usuario.id, !usuario.ativo)}
                          >
                            {usuario.ativo ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => excluirUsuario(usuario.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {usuariosFiltrados.map((usuario, index) => (
              <motion.div
                key={usuario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
              >
                {/* Header do Card */}
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-primary-600 font-medium">
                      {usuario.nome?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-medium text-gray-900 text-sm truncate cursor-pointer hover:text-primary-600 transition-colors"
                      onClick={() => navigate(`/admin/usuarios/${usuario.id}`)}
                    >
                      {usuario.nome || 'Nome não informado'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{usuario.email}</div>
                  </div>
                  <div className="flex flex-col items-end space-y-1 ml-2">
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
                      usuario.tipo_usuario === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {usuario.tipo_usuario === 'admin' ? (
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
                </div>

                {/* Informações Adicionais */}
                <div className="space-y-2 mb-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Telefone:</span>
                    <span className="font-medium text-gray-900">
                      {usuario.telefone || 'Não informado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cadastro:</span>
                    <span className="font-medium text-gray-900">
                      {formatarData(usuario.data_criacao)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Gasto:</span>
                    <span className="font-medium text-gray-900">
                      {formatarValor(estatisticas?.gastosPorUsuario[usuario.id] || 0)}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/usuarios/${usuario.id}`)}
                    className="text-xs py-2"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Ver
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUsuarioSelecionado(usuario);
                      setModalEdicao(true);
                    }}
                    className="text-xs py-2"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    variant={usuario.ativo ? "outline" : "primary"}
                    size="sm"
                    onClick={() => alterarStatusUsuario(usuario.id, !usuario.ativo)}
                    className="text-xs py-2"
                  >
                    {usuario.ativo ? (
                      <>
                        <Ban className="w-3 h-3 mr-1" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ativar
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => excluirUsuario(usuario.id)}
                    className="text-red-600 hover:text-red-700 text-xs py-2"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 pt-6 border-t border-gray-200 space-y-4 sm:space-y-0">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Mostrando {((paginaAtual - 1) * USUARIOS_POR_PAGINA) + 1} a {Math.min(paginaAtual * USUARIOS_POR_PAGINA, totalUsuarios)} de {totalUsuarios} usuários
              </div>
              
              <div className="flex justify-center sm:justify-end space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginaAtual === 1}
                  onClick={() => setPaginaAtual(prev => prev - 1)}
                  className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm"
                >
                  Anterior
                </Button>
                
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => (
                  <Button
                    key={i + 1}
                    variant={paginaAtual === i + 1 ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setPaginaAtual(i + 1)}
                    className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm"
                  >
                    {i + 1}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginaAtual === totalPaginas}
                  onClick={() => setPaginaAtual(prev => prev + 1)}
                  className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm"
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Modal de Detalhes */}
      <Modal
        isOpen={modalDetalhes}
        onClose={() => setModalDetalhes(false)}
        title={`Detalhes do Usuário: ${usuarioSelecionado?.nome || 'N/A'}`}
        size="lg"
      >
        {usuarioSelecionado && (
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome</label>
                <p className="text-gray-900">{usuarioSelecionado.nome || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{usuarioSelecionado.email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Telefone</label>
                <p className="text-gray-900">{usuarioSelecionado.telefone || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Data de Cadastro</label>
                <p className="text-gray-900">{formatarData(usuarioSelecionado.data_criacao)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <p className={`font-medium ${usuarioSelecionado.ativo ? 'text-green-600' : 'text-red-600'}`