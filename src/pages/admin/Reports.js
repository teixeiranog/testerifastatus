import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw as RefreshCwIcon,
  Search,
  Eye,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  where,
  getCountFromServer,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loading from '../../components/ui/Loading';
import SalesChart from '../../components/charts/SalesChart';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('30');
  const [rifas, setRifas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [estatisticasPedidos, setEstatisticasPedidos] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [ordenacao, setOrdenacao] = useState('recente');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState({});
  const [listaExpandida, setListaExpandida] = useState(false);

  const PEDIDOS_POR_PAGINA = 20;

  useEffect(() => {
    carregarDados();
  }, [periodoSelecionado]);

  useEffect(() => {
    carregarPedidos();
  }, [paginaAtual, ordenacao, filtroStatus, filtroPeriodo]);

  useEffect(() => {
    console.log('useEffect triggered - periodoSelecionado:', periodoSelecionado, 'pedidos:', pedidos.length);
    if (pedidos.length > 0) {
      calcularEstatisticasPedidos(pedidos);
    }
  }, [periodoSelecionado, pedidos]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar rifas
      const rifasSnapshot = await getDocs(collection(db, 'rifas'));
      const rifasData = rifasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRifas(rifasData);

      // Carregar pedidos
      const pedidosSnapshot = await getDocs(collection(db, 'pedidos'));
      const pedidosData = pedidosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPedidos(pedidosData);

      // Calcular estatísticas de pedidos
      calcularEstatisticasPedidos(pedidosData);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      
      let q = query(collection(db, 'pedidos'));
      
      // Aplicar filtros
      if (filtroStatus !== 'todos') {
        q = query(q, where('status_pagamento', '==', filtroStatus));
      }
      
      if (filtroPeriodo !== 'todos') {
        const hoje = new Date();
        let dataInicio;
        
        switch (filtroPeriodo) {
          case 'hoje':
            dataInicio = startOfDay(hoje);
            break;
          case '7dias':
            dataInicio = startOfDay(subDays(hoje, 7));
            break;
          case '30dias':
            dataInicio = startOfDay(subDays(hoje, 30));
            break;
        }
        
        if (dataInicio) {
          q = query(q, where('data_criacao', '>=', dataInicio));
        }
      }
      
      // Aplicar ordenação
      switch (ordenacao) {
        case 'recente':
          q = query(q, orderBy('data_criacao', 'desc'));
          break;
        case 'valor_desc':
          q = query(q, orderBy('valor_total', 'desc'));
          break;
        case 'valor_asc':
          q = query(q, orderBy('valor_total', 'asc'));
          break;
      }
      
      const snapshot = await getDocs(q);
      const pedidosData = [];
      
      for (const doc of snapshot.docs) {
        const pedidoData = {
          id: doc.id,
          ...doc.data()
        };
        
        // Buscar dados do usuário
        if (pedidoData.usuario_id) {
          try {
            const userDoc = await getDocs(query(collection(db, 'usuarios'), where('uid', '==', pedidoData.usuario_id)));
            if (!userDoc.empty) {
              pedidoData.usuario = userDoc.docs[0].data();
            }
          } catch (error) {
            console.error('Erro ao buscar usuário:', error);
          }
        }
        
        // Buscar dados da rifa
        if (pedidoData.rifa_id) {
          try {
            const rifaDoc = await getDocs(query(collection(db, 'rifas'), where('id', '==', pedidoData.rifa_id)));
            if (!rifaDoc.empty) {
              pedidoData.rifa = rifaDoc.docs[0].data();
            }
          } catch (error) {
            console.error('Erro ao buscar rifa:', error);
          }
        }
        
        pedidosData.push(pedidoData);
      }
      
      setPedidos(pedidosData);
      
      // Contar total de pedidos
      const countSnapshot = await getCountFromServer(collection(db, 'pedidos'));
      setTotalPedidos(countSnapshot.data().count);
      
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const calcularEstatisticasPedidos = (pedidosData) => {
    console.log('Calculando estatísticas para período:', periodoSelecionado, 'dias');
    
    // Filtrar pedidos pelo periodoSelecionado (7, 30, 90, 365 dias)
    const pedidosFiltrados = pedidosData.filter(pedido => {
      const dataPedido = pedido.data_criacao?.toDate ? pedido.data_criacao.toDate() : new Date(pedido.data_criacao);
      const hoje = new Date();
      const diasAtras = parseInt(periodoSelecionado);
      const dataInicio = new Date(hoje.getTime() - (diasAtras * 24 * 60 * 60 * 1000));
      
      return dataPedido >= dataInicio;
    });
    
    console.log('Pedidos filtrados:', pedidosFiltrados.length, 'de', pedidosData.length, 'pedidos');

    const stats = {
      // Contadores básicos (baseados no período selecionado)
      total: pedidosFiltrados.length,
      pago: pedidosFiltrados.filter(p => p.status_pagamento === 'pago').length,
      pendente: pedidosFiltrados.filter(p => p.status_pagamento === 'aguardando_pagamento' || p.status_pagamento === 'reservado').length,
      expirado: pedidosFiltrados.filter(p => p.status_pagamento === 'expirado').length,
      cancelado: pedidosFiltrados.filter(p => p.status_pagamento === 'cancelado').length,
      
      // Valores financeiros (baseados no período selecionado)
      receita_total: pedidosFiltrados
        .filter(p => p.status_pagamento === 'pago')
        .reduce((sum, p) => sum + (p.valor_total || 0), 0),
        
      valor_nao_aprovado: pedidosFiltrados
        .filter(p => ['aguardando_pagamento', 'reservado', 'expirado', 'cancelado'].includes(p.status_pagamento))
        .reduce((sum, p) => sum + (p.valor_total || 0), 0),
        
      valor_pendente: pedidosFiltrados
        .filter(p => ['aguardando_pagamento', 'reservado'].includes(p.status_pagamento))
        .reduce((sum, p) => sum + (p.valor_total || 0), 0),
        
      valor_perdido: pedidosFiltrados
        .filter(p => ['expirado', 'cancelado'].includes(p.status_pagamento))
        .reduce((sum, p) => sum + (p.valor_total || 0), 0),
        
      // Valores por período (sempre baseados em hoje, 7 dias e 30 dias)
      receita_hoje: pedidosData
        .filter(p => {
          if (p.status_pagamento !== 'pago') return false;
          const dataPedido = p.data_criacao?.toDate ? p.data_criacao.toDate() : new Date(p.data_criacao);
          const hoje = new Date();
          return dataPedido.toDateString() === hoje.toDateString();
        })
        .reduce((sum, p) => sum + (p.valor_total || 0), 0),
        
      receita_7dias: pedidosData
        .filter(p => {
          if (p.status_pagamento !== 'pago') return false;
          const dataPedido = p.data_criacao?.toDate ? p.data_criacao.toDate() : new Date(p.data_criacao);
          const setedias = new Date();
          setedias.setDate(setedias.getDate() - 7);
          return dataPedido >= setedias;
        })
        .reduce((sum, p) => sum + (p.valor_total || 0), 0),
        
      receita_30dias: pedidosData
        .filter(p => {
          if (p.status_pagamento !== 'pago') return false;
          const dataPedido = p.data_criacao?.toDate ? p.data_criacao.toDate() : new Date(p.data_criacao);
          const trintaDias = new Date();
          trintaDias.setDate(trintaDias.getDate() - 30);
          return dataPedido >= trintaDias;
        })
        .reduce((sum, p) => sum + (p.valor_total || 0), 0),
        
      // Taxas de conversão
      taxa_conversao: 0,
      taxa_perda: 0,
      valor_medio: 0,
      
      // Análises extras (baseadas no período selecionado)
      reembolsos: pedidosFiltrados.filter(p => p.reembolsado === true).length,
      valor_reembolsos: pedidosFiltrados
        .filter(p => p.reembolsado === true)
        .reduce((sum, p) => sum + (p.valor_reembolso || p.valor_total || 0), 0),
        
      disputas: pedidosFiltrados.filter(p => p.em_disputa === true).length,
    };
    
    // Calcular taxas
    if (stats.total > 0) {
      stats.taxa_conversao = (stats.pago / stats.total) * 100;
      stats.taxa_perda = ((stats.expirado + stats.cancelado) / stats.total) * 100;
    }
    
    if (stats.pago > 0) {
      stats.valor_medio = stats.receita_total / stats.pago;
    }
    
    setEstatisticasPedidos(stats);
  };

  const atualizarStatusPedido = async (pedidoId, novoStatus) => {
    try {
      setAtualizandoStatus(prev => ({ ...prev, [pedidoId]: true }));
      
      const pedidoRef = doc(db, 'pedidos', pedidoId);
      await updateDoc(pedidoRef, {
        status_pagamento: novoStatus,
        data_atualizacao: new Date()
      });
      
      toast.success('Status atualizado com sucesso!');
      carregarPedidos();
      carregarDados();
      
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setAtualizandoStatus(prev => ({ ...prev, [pedidoId]: false }));
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pago':
        return {
          label: 'Pago',
          color: 'text-success-600',
          bgColor: 'bg-success-100',
          icon: CheckCircle
        };
      case 'aguardando_pagamento':
        return {
          label: 'Aguardando',
          color: 'text-warning-600',
          bgColor: 'bg-warning-100',
          icon: Clock
        };
      case 'reservado':
        return {
          label: 'Reservado',
          color: 'text-info-600',
          bgColor: 'bg-info-100',
          icon: Clock
        };
      case 'expirado':
        return {
          label: 'Expirado',
          color: 'text-danger-600',
          bgColor: 'bg-danger-100',
          icon: XCircle
        };
      case 'cancelado':
        return {
          label: 'Cancelado',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: XCircle
        };
      default:
        return {
          label: 'Desconhecido',
          color: 'text-gray-800',
          bgColor: 'bg-gray-100',
          icon: AlertCircle
        };
    }
  };

  const formatarData = (data) => {
    if (!data) return 'N/A';
    const dataObj = data.toDate ? data.toDate() : new Date(data);
    return format(dataObj, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  const pedidosFiltrados = pedidos.filter(pedido => {
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      return (
        pedido.id.toLowerCase().includes(termo) ||
        pedido.usuario?.nome?.toLowerCase().includes(termo) ||
        pedido.usuario?.email?.toLowerCase().includes(termo) ||
        pedido.rifa?.titulo?.toLowerCase().includes(termo)
      );
    }
    return true;
  });

  const totalPaginas = Math.ceil(totalPedidos / PEDIDOS_POR_PAGINA);

  if (loading && rifas.length === 0) {
    return <Loading fullScreen text="Carregando relatórios..." />;
  }

  return (
    <div className="max-w-full overflow-x-hidden space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Análises detalhadas e gerenciamento de pedidos
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                      <select
              value={periodoSelecionado}
              onChange={(e) => setPeriodoSelecionado(e.target.value)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
          

        </div>
      </div>

      {/* Seção de Análise de Pedidos */}
      {estatisticasPedidos && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Análise de Pedidos - Últimos {periodoSelecionado} dias
            </h2>
          </div>

          {/* Cards Principais de Pedidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Total de Pedidos
                  </p>
                  <p className="text-2xl font-bold">{estatisticasPedidos.total}</p>
                  <p className="text-blue-100 text-xs mt-1">
                    Taxa conversão: {estatisticasPedidos.taxa_conversao.toFixed(1)}%
                  </p>
                </div>
                <ShoppingCart className="w-10 h-10 text-blue-200" />
              </div>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">
                    Receita Aprovada
                  </p>
                  <p className="text-2xl font-bold">{formatarValor(estatisticasPedidos.receita_total)}</p>
                  <p className="text-green-100 text-xs mt-1">
                    {estatisticasPedidos.pago} pedidos pagos
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-200" />
              </div>
            </Card>
            
            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">
                    Valor Não Aprovado
                  </p>
                  <p className="text-2xl font-bold">{formatarValor(estatisticasPedidos.valor_nao_aprovado)}</p>
                  <p className="text-red-100 text-xs mt-1">
                    {estatisticasPedidos.pendente + estatisticasPedidos.expirado + estatisticasPedidos.cancelado} pedidos
                  </p>
                </div>
                <XCircle className="w-10 h-10 text-red-200" />
              </div>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">
                    Reembolsos
                    {filtroPeriodo !== 'todos' && (
                      <span className="block text-xs opacity-75">
                        {filtroPeriodo === 'hoje' ? 'Hoje' : 
                         filtroPeriodo === '7dias' ? 'Últimos 7 dias' : 
                         filtroPeriodo === '30dias' ? 'Últimos 30 dias' : ''}
                      </span>
                    )}
                  </p>
                  <p className="text-2xl font-bold">{formatarValor(estatisticasPedidos.valor_reembolsos)}</p>
                  <p className="text-purple-100 text-xs mt-1">
                    {estatisticasPedidos.reembolsos} casos
                  </p>
                </div>
                <RefreshCwIcon className="w-10 h-10 text-purple-200" />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Gráfico de Vendas */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Vendas por Período
          </h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => toast.success('Exportando relatório...')}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
        
        <SalesChart rifas={rifas} pedidos={pedidos} periodo={parseInt(periodoSelecionado)} mostrarDadosExemplo={true} />
      </Card>

      {/* Lista de Pedidos */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Lista de Pedidos
          </h3>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toast.success('Exportando lista...')}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="space-y-4 mb-6">
          {/* Barra de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por ID, usuário, email ou rifa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="todos">Todos os Status</option>
              <option value="pago">Pago</option>
              <option value="aguardando_pagamento">Aguardando</option>
              <option value="reservado">Reservado</option>
              <option value="expirado">Expirado</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="todos">Todos os Períodos</option>
              <option value="hoje">Hoje</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
            </select>

            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="recente">Mais Recentes</option>
              <option value="valor_desc">Maior Valor</option>
              <option value="valor_asc">Menor Valor</option>
            </select>

            <Button 
              variant="outline" 
              onClick={() => {
                setBusca('');
                setFiltroStatus('todos');
                setFiltroPeriodo('todos');
                setOrdenacao('recente');
              }}
              className="flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        </div>

        {/* Lista de Pedidos - Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rifa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pedidosFiltrados.length > 0 ? (
                pedidosFiltrados.map((pedido) => {
                  const statusInfo = getStatusInfo(pedido.status_pagamento);
                  return (
                    <tr key={pedido.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {pedido.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{pedido.usuario?.nome || 'N/A'}</div>
                          <div className="text-gray-500">{pedido.usuario?.email || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pedido.rifa?.titulo || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatarValor(pedido.valor_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                          <statusInfo.icon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatarData(pedido.data_criacao)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setPedidoSelecionado(pedido);
                              setModalDetalhes(true);
                            }}
                            className="text-primary-600 hover:text-primary-900"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Lista de Pedidos - Mobile */}
        <div className="lg:hidden space-y-3">
          {pedidosFiltrados.length > 0 ? (
            <>
              {/* Primeiros 4 pedidos sempre visíveis */}
              {pedidosFiltrados.slice(0, 4).map((pedido) => {
              const statusInfo = getStatusInfo(pedido.status_pagamento);
              return (
                <Card key={pedido.id} className="p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          ID: {pedido.id}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {pedido.usuario?.nome || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {pedido.usuario?.email || 'N/A'}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                          <statusInfo.icon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p className="truncate">{pedido.rifa?.titulo || 'N/A'}</p>
                      <p className="font-medium text-gray-900">{formatarValor(pedido.valor_total)}</p>
                      <p className="text-xs text-gray-500">{formatarData(pedido.data_criacao)}</p>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setPedidoSelecionado(pedido);
                          setModalDetalhes(true);
                        }}
                        className="text-primary-600 hover:text-primary-900 text-sm"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
              })}
              
              {/* Pedidos adicionais (visíveis apenas quando expandido) */}
              {listaExpandida && pedidosFiltrados.slice(4).map((pedido) => {
                const statusInfo = getStatusInfo(pedido.status_pagamento);
                return (
                  <Card key={pedido.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            ID: {pedido.id}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {pedido.usuario?.nome || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {pedido.usuario?.email || 'N/A'}
                          </p>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                            <statusInfo.icon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p className="truncate">{pedido.rifa?.titulo || 'N/A'}</p>
                        <p className="font-medium text-gray-900">{formatarValor(pedido.valor_total)}</p>
                        <p className="text-xs text-gray-500">{formatarData(pedido.data_criacao)}</p>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            setPedidoSelecionado(pedido);
                            setModalDetalhes(true);
                          }}
                          className="text-primary-600 hover:text-primary-900 text-sm"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
              
              {/* Botão para expandir/recolher */}
              {pedidosFiltrados.length > 4 && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setListaExpandida(!listaExpandida)}
                    className="flex items-center space-x-2"
                  >
                    {listaExpandida ? (
                      <>
                        <span>Ver menos</span>
                        <span className="text-xs">({pedidosFiltrados.length - 4} menos)</span>
                      </>
                    ) : (
                      <>
                        <span>Ver mais</span>
                        <span className="text-xs">({pedidosFiltrados.length - 4} mais)</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Nenhum pedido encontrado
            </div>
          )}
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Mostrando página {paginaAtual} de {totalPaginas}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                disabled={paginaAtual === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                disabled={paginaAtual === totalPaginas}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

              {/* Métricas Gerais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Crescimento</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Taxa de Conversão:</span>
              <span className="font-semibold text-green-600">
                {estatisticasPedidos?.taxa_conversao.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taxa de Perda:</span>
              <span className="font-semibold text-red-600">
                {estatisticasPedidos?.taxa_perda.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Valor Médio:</span>
              <span className="font-semibold text-blue-600">
                {formatCurrency(estatisticasPedidos?.valor_medio)}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Participação</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total de Rifas:</span>
              <span className="font-semibold">{rifas.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rifas Ativas:</span>
              <span className="font-semibold text-green-600">
                {rifas.filter(r => r.status === 'ativa').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Vendido:</span>
              <span className="font-semibold text-blue-600">
                {rifas.reduce((sum, r) => sum + (r.qtd_vendida || 0), 0)}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Resumo Financeiro</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Receita Total:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(estatisticasPedidos?.receita_total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Não Aprovado:</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(estatisticasPedidos?.valor_nao_aprovado)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reembolsos:</span>
              <span className="font-semibold text-orange-600">
                {formatCurrency(estatisticasPedidos?.valor_reembolsos)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal de Detalhes do Pedido */}
      <Modal
        isOpen={modalDetalhes}
        onClose={() => setModalDetalhes(false)}
        title="Detalhes do Pedido"
        size="lg"
      >
        {pedidoSelecionado && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Informações do Pedido</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div><span className="font-medium">ID:</span> {pedidoSelecionado.id}</div>
                  <div><span className="font-medium">Valor:</span> {formatarValor(pedidoSelecionado.valor_total)}</div>
                  <div><span className="font-medium">Status:</span> {getStatusInfo(pedidoSelecionado.status_pagamento).label}</div>
                  <div><span className="font-medium">Data:</span> {formatarData(pedidoSelecionado.data_criacao)}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Informações do Usuário</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div><span className="font-medium">Nome:</span> {pedidoSelecionado.usuario?.nome || 'N/A'}</div>
                  <div><span className="font-medium">Email:</span> {pedidoSelecionado.usuario?.email || 'N/A'}</div>
                  <div><span className="font-medium">Telefone:</span> {pedidoSelecionado.usuario?.telefone || 'N/A'}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Informações da Rifa</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div><span className="font-medium">Título:</span> {pedidoSelecionado.rifa?.titulo || 'N/A'}</div>
                <div><span className="font-medium">Valor por número:</span> {formatarValor(pedidoSelecionado.rifa?.valor || 0)}</div>
                <div><span className="font-medium">Números comprados:</span> {pedidoSelecionado.numeros?.join(', ') || 'N/A'}</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setModalDetalhes(false)}
                className="w-full sm:w-auto text-sm"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reports;
