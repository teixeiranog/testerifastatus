import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, 
  Calendar, 
  Trophy, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Search,
  Filter,
  DollarSign,
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format, isAfter, isBefore, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useRaffle } from '../contexts/RaffleContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { optimizeImage } from '../config/cloudinary';

const MyTickets = () => {
  const { currentUser } = useAuth();
  const { meusTickets, loading, buscarMeusTickets } = useRaffle();
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState('recente');
  const [periodo, setPeriodo] = useState('todos');
     const [ticketsExpandidos, setTicketsExpandidos] = useState(new Set());
   const [filtrosAvancadosExpandidos, setFiltrosAvancadosExpandidos] = useState(false);

  useEffect(() => {
    if (currentUser) {
      buscarMeusTickets();
    }
  }, [currentUser]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return 'Data não definida';
    
    const dateObj = date.toDate ? date.toDate() : new Date(date);
     return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
  };

  const getStatusInfo = (ticket) => {
    const now = new Date();
    const sortDate = ticket.rifa?.data_sorteio ? 
      (ticket.rifa.data_sorteio.toDate ? ticket.rifa.data_sorteio.toDate() : new Date(ticket.rifa.data_sorteio)) :
      null;

    // Verificar se expirou baseado na data de expiração
    const expireTime = ticket.data_expiracao ? 
      (ticket.data_expiracao.toDate ? ticket.data_expiracao.toDate() : new Date(ticket.data_expiracao)) :
      null;

    switch (ticket.status_pagamento) {
      case 'pago':
        if (sortDate && now > sortDate) {
          return {
            status: 'sorteado',
            label: 'Sorteado',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            icon: Trophy
          };
        } else {
          return {
            status: 'confirmado',
            label: 'Confirmado',
            color: 'text-success-600',
            bgColor: 'bg-success-50',
            icon: CheckCircle
          };
        }

      case 'aguardando_pagamento':
        if (expireTime && now > expireTime) {
          return {
            status: 'expirado',
            label: 'Expirado',
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            icon: AlertCircle
          };
        } else {
          return {
            status: 'pendente',
            label: 'Aguardando Pagamento',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            icon: Clock
          };
        }

      case 'reservado':
        if (expireTime && now > expireTime) {
          return {
            status: 'expirado',
            label: 'Expirado',
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            icon: AlertCircle
          };
        } else {
          return {
            status: 'pendente',
            label: 'Reservado',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            icon: Clock
          };
        }

      case 'expirado':
        return {
          status: 'expirado',
          label: 'Expirado',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: AlertCircle
        };

      case 'cancelado':
        return {
          status: 'cancelado',
          label: 'Cancelado',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          icon: AlertCircle
        };

      default:
        return {
          status: 'desconhecido',
          label: 'Status Desconhecido',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          icon: AlertCircle
        };
    }
  };

  // Função de filtro e busca avançada
  const filtrarTickets = () => {
    let ticketsFiltrados = [...meusTickets];

    // Filtro por status
    if (filtro !== 'todos') {
      ticketsFiltrados = ticketsFiltrados.filter(ticket => {
        const statusInfo = getStatusInfo(ticket);
        return statusInfo.status === filtro;
      });
    }

    // Busca por nome da rifa
    if (busca.trim()) {
      ticketsFiltrados = ticketsFiltrados.filter(ticket =>
        ticket.rifa?.titulo?.toLowerCase().includes(busca.toLowerCase())
      );
    }

    // Filtro por período
    if (periodo !== 'todos') {
      const agora = new Date();
      let dataInicio, dataFim;

      switch (periodo) {
        case 'mes_atual':
          dataInicio = startOfMonth(agora);
          dataFim = endOfMonth(agora);
          break;
        case 'mes_passado':
          const mesPassado = subMonths(agora, 1);
          dataInicio = startOfMonth(mesPassado);
          dataFim = endOfMonth(mesPassado);
          break;
        case 'ultimos_30_dias':
          dataInicio = subMonths(agora, 1);
          dataFim = agora;
          break;
        default:
          break;
      }

      if (dataInicio && dataFim) {
        ticketsFiltrados = ticketsFiltrados.filter(ticket => {
          const dataTicket = ticket.data_criacao?.toDate ? ticket.data_criacao.toDate() : new Date(ticket.data_criacao);
          return isAfter(dataTicket, dataInicio) && isBefore(dataTicket, dataFim);
        });
      }
    }

    // Ordenação
    ticketsFiltrados.sort((a, b) => {
      switch (ordenacao) {
        case 'recente':
          const dataA = a.data_criacao?.toDate ? a.data_criacao.toDate() : new Date(a.data_criacao);
          const dataB = b.data_criacao?.toDate ? b.data_criacao.toDate() : new Date(b.data_criacao);
          return dataB - dataA;
        case 'valor_desc':
          return (b.valor_total || 0) - (a.valor_total || 0);
        case 'valor_asc':
          return (a.valor_total || 0) - (b.valor_total || 0);
        case 'alfabetico':
          return (a.rifa?.titulo || '').localeCompare(b.rifa?.titulo || '');
        default:
          return 0;
      }
    });

    return ticketsFiltrados;
  };

  // Função para alternar expansão de um ticket
  const toggleTicketExpansao = (ticketId) => {
    setTicketsExpandidos(prev => {
      const novo = new Set(prev);
      if (novo.has(ticketId)) {
        novo.delete(ticketId);
      } else {
        novo.add(ticketId);
      }
      return novo;
    });
  };

  

  // Estatísticas do dashboard
  const estatisticas = useMemo(() => {
    if (!meusTickets.length) return null;

    const totalInvestido = meusTickets.reduce((sum, ticket) => sum + (ticket.valor_total || 0), 0);
    const totalNumeros = meusTickets.reduce((sum, ticket) => sum + (ticket.numeros?.length || ticket.quantidade || 0), 0);
    
    const contadores = {
      todos: meusTickets.length,
      confirmado: 0,
      pendente: 0,
      sorteado: 0,
      expirado: 0,
      cancelado: 0
    };

    const rifasParticipadas = new Set();
    let proximosSorteios = [];
    let rifaMaisInvestida = null;
    let maiorInvestimento = 0;

    meusTickets.forEach(ticket => {
      const statusInfo = getStatusInfo(ticket);
      contadores[statusInfo.status]++;
      
      // Rifas participadas
      if (ticket.id_rifa) {
        rifasParticipadas.add(ticket.id_rifa);
      }
      
      // Próximos sorteios
      if (ticket.rifa?.data_sorteio && statusInfo.status === 'confirmado') {
        const sorteioDate = ticket.rifa.data_sorteio.toDate ? ticket.rifa.data_sorteio.toDate() : new Date(ticket.rifa.data_sorteio);
        if (isAfter(sorteioDate, new Date())) {
          proximosSorteios.push({
            rifa: ticket.rifa.titulo,
            data: sorteioDate,
            id: ticket.id_rifa
          });
        }
      }
      
      // Rifa com maior investimento
      if (ticket.valor_total > maiorInvestimento) {
        maiorInvestimento = ticket.valor_total;
        rifaMaisInvestida = ticket.rifa?.titulo;
      }
    });

    // Ordenar próximos sorteios por data
    proximosSorteios = proximosSorteios
      .sort((a, b) => a.data - b.data)
      .slice(0, 3);

    return {
      totalInvestido,
      totalNumeros,
      contadores,
      rifasParticipadas: rifasParticipadas.size,
      proximosSorteios,
      rifaMaisInvestida,
      investimentoMedio: totalInvestido / meusTickets.length
    };
  }, [meusTickets]);

  

  const contarTicketsPorStatus = () => {
    return estatisticas?.contadores || {
      todos: 0, confirmado: 0, pendente: 0, sorteado: 0, expirado: 0, cancelado: 0
    };
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            Acesso Restrito
          </h2>
          <p className="text-gray-500 mb-6">
            Você precisa estar logado para ver seus tickets.
          </p>
          <Link to="/">
            <Button variant="primary">
              Ir para Início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const ticketsFiltrados = filtrarTickets();
  const contadores = contarTicketsPorStatus();

  const filtros = [
    { key: 'todos', label: 'Todos', count: contadores.todos },
    { key: 'confirmado', label: 'Confirmados', count: contadores.confirmado },
    { key: 'pendente', label: 'Pendentes', count: contadores.pendente },
    { key: 'sorteado', label: 'Sorteados', count: contadores.sorteado },
    { key: 'expirado', label: 'Expirados', count: contadores.expirado }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header com Dashboard */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Meus Tickets
              </h1>
              <p className="text-gray-600">
                Dashboard completo dos seus investimentos em rifas
              </p>
            </div>
            
            <div className="flex space-x-3 mt-4 md:mt-0">
               {/* Botões removidos conforme solicitado */}
            </div>
          </div>

          {/* Dashboard de Estatísticas */}
          {estatisticas && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-blue-100 text-sm font-medium">Total Investido</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(estatisticas.totalInvestido)}
                      </p>
                      <p className="text-blue-100 text-xs">
                        Média: {formatCurrency(estatisticas.investimentoMedio)}
                      </p>
                    </div>
                    <DollarSign className="w-10 h-10 text-blue-200" />
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-green-100 text-sm font-medium">Total de Números</p>
                      <p className="text-2xl font-bold">{estatisticas.totalNumeros}</p>
                      <p className="text-green-100 text-xs">
                        {estatisticas.rifasParticipadas} rifas diferentes
                      </p>
                    </div>
                    <Target className="w-10 h-10 text-green-200" />
                  </div>
                </Card>
              </motion.div>
            </div>
          )}
        </div>

        {/* Controles de Filtro e Busca */}
        <Card className="mb-8">
           <div className="space-y-6">
            {/* Barra de Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome da rifa..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                 className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
              />
            </div>

              {/* Filtros de Status */}
             <div className="border-b border-gray-200 pb-6">
               <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
                 <Filter className="w-5 h-5 mr-2 text-primary-600" />
                 Filtrar por Status
               </h3>
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {filtros.map((filtroItem) => (
                  <button
                    key={filtroItem.key}
                    onClick={() => setFiltro(filtroItem.key)}
                     className={`px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center justify-center min-h-[60px] ${
                      filtro === filtroItem.key
                         ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                         : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md border border-gray-200'
                    }`}
                  >
                     <span className="font-semibold">{filtroItem.label}</span>
                    {filtroItem.count > 0 && (
                       <span className={`mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                        filtro === filtroItem.key
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {filtroItem.count}
                      </span>
                    )}
                  </button>
                ))}
               </div>
              </div>

              {/* Filtros Avançados */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  onClick={() => setFiltrosAvancadosExpandidos(!filtrosAvancadosExpandidos)}
                  className="w-full flex items-center justify-between text-base font-semibold text-gray-800 hover:text-primary-600 transition-colors"
                >
                  <div className="flex items-center">
                    <Search className="w-5 h-5 mr-2 text-primary-600" />
                    Filtros Avançados
                  </div>
                  {filtrosAvancadosExpandidos ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                <AnimatePresence>
                  {filtrosAvancadosExpandidos && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Período
                            </label>
                <select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm"
                >
                  <option value="todos">Todos os períodos</option>
                  <option value="mes_atual">Mês atual</option>
                  <option value="mes_passado">Mês passado</option>
                  <option value="ultimos_30_dias">Últimos 30 dias</option>
                </select>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Ordenar por
                            </label>
                <select
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm"
                >
                  <option value="recente">Mais recente</option>
                  <option value="valor_desc">Maior valor</option>
                  <option value="valor_asc">Menor valor</option>
                  <option value="alfabetico">Alfabético</option>
                </select>
              </div>
            </div>
          </div>
                </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>



        {/* Lista de Tickets */}
        {loading ? (
          <Loading text="Carregando seus tickets..." />
        ) : ticketsFiltrados.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {ticketsFiltrados.map((ticket, index) => {
                        const statusInfo = getStatusInfo(ticket);
                  const optimizedImageUrl = ticket.rifa?.imagens?.[0] ? optimizeImage(ticket.rifa.imagens[0], {
                      width: 120,
                      height: 80,
                      quality: 'auto',
                      crop: 'fill'
                    }) : null;

                    return (
                      <motion.div
                      key={ticket.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                        <div className="p-4">
                           {/* Header compacto com título, status e botão expandir */}
                           <div className="flex items-center justify-between">
                             <div className="flex-1">
                               <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                 {ticket.rifa?.titulo || 'Rifa'}
                               </h3>
                                                               <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  <span>{formatDate(ticket.data_criacao)}</span>
                                  </div>
                              </div>
                              
                             <div className="flex items-center gap-3">
                               {/* Status */}
                               <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                                 <statusInfo.icon className="w-4 h-4 mr-1" />
                                 {statusInfo.label}
                            </div>
                            
                               {/* Botão expandir/recolher */}
                               <button
                                 onClick={() => toggleTicketExpansao(ticket.id)}
                                 className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                 title={ticketsExpandidos.has(ticket.id) ? "Recolher detalhes" : "Expandir detalhes"}
                               >
                                 {ticketsExpandidos.has(ticket.id) ? (
                                   <ChevronUp className="w-5 h-5 text-gray-600" />
                                 ) : (
                                   <ChevronDown className="w-5 h-5 text-gray-600" />
                                 )}
                               </button>
                            </div>
                          </div>

                             {/* Conteúdo expansível */}
                          <AnimatePresence>
                               {ticketsExpandidos.has(ticket.id) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                   <div className="space-y-4">
                                     {/* Resumo dos valores */}
                                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                       <div className="text-center sm:text-left">
                                         <div className="text-2xl font-bold text-primary-600">
                                           {ticket.numeros?.length || ticket.quantidade}
                                            </div>
                                         <div className="text-sm text-gray-600">Números</div>
                                        </div>
                                        
                                       <div className="text-center sm:text-left">
                                         <div className="text-2xl font-bold text-green-600">
                                  {formatCurrency(ticket.valor_total)}
                                </div>
                                         <div className="text-sm text-gray-600">Total investido</div>
                              </div>
                              
                                       <div className="text-center sm:text-left">
                                         <div className="text-lg font-semibold text-gray-700">
                                  {formatCurrency(ticket.rifa?.valor || 0)}
                                </div>
                                         <div className="text-sm text-gray-600">Por número</div>
                              </div>
                            </div>

                            {/* Números */}
                                     {ticket.numeros && ticket.numeros.length > 0 ? (
                                       <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                         <div className="flex items-center justify-between mb-3">
                                           <div className="flex items-center">
                                             <Target className="w-5 h-5 text-blue-600 mr-2" />
                                             <span className="font-semibold text-blue-900">
                                               Seus Números ({ticket.numeros.length})
                                </span>
                                           </div>
                                           <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                                             Guarde estes números!
                                           </span>
                                         </div>
                                         <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                                           {ticket.numeros.map((numero, idx) => (
                                    <span
                                      key={idx}
                                               className="bg-blue-600 text-white px-2 py-1.5 rounded text-sm font-bold text-center hover:bg-blue-700 transition-colors"
                                    >
                                      {String(numero).padStart(4, '0')}
                                    </span>
                                  ))}
                                         </div>
                                       </div>
                                     ) : (
                                       <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                         <div className="flex items-center">
                                           <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                                           <span className="text-yellow-800 text-sm">
                                             Números ainda não disponíveis. Aguarde a confirmação do pagamento.
                                    </span>
                                </div>
                              </div>
                            )}

                            {/* Ações */}
                                     <div className="flex flex-col sm:flex-row gap-3">
                                       <Link to={`/rifa/${ticket.id_rifa}`} className="flex-1">
                                         <Button variant="outline" size="sm" className="w-full">
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ver Rifa
                                </Button>
                              </Link>
                              
                                                                               {/* Botão de verificar pagamento removido conforme solicitado */}
                            </div>
                          </div>
                                 </motion.div>
                               )}
                             </AnimatePresence>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {busca.trim() ? `Nenhum resultado para "${busca}"` :
               filtro === 'todos' ? 'Nenhum ticket encontrado' : 
               `Nenhum ticket ${filtros.find(f => f.key === filtro)?.label.toLowerCase()}`}
            </h3>
            <p className="text-gray-500 mb-6">
              {busca.trim() ? 'Tente buscar por outro termo.' :
               filtro === 'todos' ? 'Você ainda não participou de nenhuma rifa. Que tal começar agora?' :
               'Não há tickets com este status no momento.'}
            </p>
            {filtro === 'todos' && !busca.trim() ? (
              <Link to="/">
                <Button variant="primary">
                  Ver Rifas Ativas
                </Button>
              </Link>
            ) : (
              <div className="space-x-3">
                {busca.trim() && (
                  <Button
                    variant="outline"
                    onClick={() => setBusca('')}
                  >
                    Limpar Busca
                  </Button>
                )}
                {filtro !== 'todos' && (
                  <Button
                    variant="outline"
                    onClick={() => setFiltro('todos')}
                  >
                    Ver Todos os Tickets
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;


