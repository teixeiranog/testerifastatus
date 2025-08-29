import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Ticket, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Award,
  Activity,
  ExternalLink
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loading from '../../components/ui/Loading';
import SalesChart from '../../components/charts/SalesChart';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { estatisticas, rifas, pedidos, usuarios, loading } = useAdmin();
  const navigate = useNavigate();
  const [periodoSelecionado, setPeriodoSelecionado] = useState('30');

  // Debug logs
  console.log('Dashboard - rifas:', rifas);
  console.log('Dashboard - pedidos:', pedidos);
  console.log('Dashboard - loading:', loading);
  console.log('Dashboard - estatisticas:', estatisticas);
  console.log('Dashboard - usuarios:', usuarios);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  const calcularEstatisticasRapidas = () => {
    const agora = new Date();
    const diasAtras = parseInt(periodoSelecionado);
    const dataInicio = new Date(agora.getTime() - (diasAtras * 24 * 60 * 60 * 1000));

    // Filtrar rifas pelo período selecionado
    const rifasDoPeriodo = rifas.filter(rifa => {
      const dataRifa = rifa.data_criacao?.toDate ? 
        rifa.data_criacao.toDate() : 
        new Date(rifa.data_criacao);
      return dataRifa >= dataInicio;
    });

    const rifasAtivas = rifasDoPeriodo.filter(rifa => rifa.status === 'ativa');
    const rifasFinalizadas = rifasDoPeriodo.filter(rifa => rifa.status === 'finalizada');

    // Calcular vendas do período
    const pedidosDoPeriodo = pedidos.filter(pedido => {
      const pedidoData = pedido.data_criacao?.toDate ? pedido.data_criacao.toDate() : new Date(pedido.data_criacao);
      return pedidoData >= dataInicio && pedido.status_pagamento === 'pago';
    });

    const totalVendas = pedidosDoPeriodo.reduce((total, pedido) => {
      return total + (pedido.valor_total || 0);
    }, 0);

    const totalNumerosVendidos = pedidosDoPeriodo.reduce((total, pedido) => {
      return total + (pedido.quantidade || pedido.numeros?.length || 0);
    }, 0);

    const totalNumerosDisponiveis = rifasDoPeriodo.reduce((total, rifa) => {
      return total + (rifa.qtd_total || 0);
    }, 0);

    const taxaConversao = totalNumerosDisponiveis > 0 ? ((totalNumerosVendidos / totalNumerosDisponiveis) * 100).toFixed(1) : '0';

    return {
      rifasAtivas: rifasAtivas.length,
      rifasFinalizadas: rifasFinalizadas.length,
      totalVendas,
      taxaConversao
    };
  };

  const stats = calcularEstatisticasRapidas();
  const rifasRecentes = rifas.slice(0, 5);

  if (loading) {
    return <Loading />;
  }

  // Funções de navegação
  const navegarPara = (rota) => {
    toast.success('Redirecionando...', { duration: 1500 });
    navigate(rota);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Visão geral do seu sistema de rifas
          </p>
        </div>
        
        <div className="flex space-x-3">
          <select
            value={periodoSelecionado}
            onChange={(e) => setPeriodoSelecionado(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1" onClick={() => navegarPara('/admin/relatorios')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Arrecadado</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalVendas)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1" onClick={() => navegarPara('/admin/rifas')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Rifas Ativas</p>
              <p className="text-2xl font-bold">{stats.rifasAtivas}</p>
            </div>
            <Ticket className="w-8 h-8 text-blue-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1" onClick={() => navegarPara('/admin/usuarios')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Participantes</p>
              <p className="text-2xl font-bold">{formatNumber(stats.rifasFinalizadas)}</p>
            </div>
            <Users className="w-8 h-8 text-purple-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1" onClick={() => navegarPara('/admin/relatorios')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Taxa Conversão</p>
              <p className="text-2xl font-bold">{stats.taxaConversao}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-200" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Vendas */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Vendas por Período
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navegarPara('/admin/relatorios')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver Relatório
            </Button>
          </div>
          
          <SalesChart rifas={rifas} pedidos={pedidos} periodo={parseInt(periodoSelecionado)} />
        </Card>

        {/* Rifas Recentes */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Rifas Recentes
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navegarPara('/admin/rifas')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Todas
            </Button>
          </div>
          
          <div className="space-y-4">
            {rifasRecentes.length > 0 ? (
              rifasRecentes.map((rifa, index) => (
                <div 
                  key={rifa.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => navigate(`/admin/rifas`)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 truncate max-w-32">
                        {rifa.titulo}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(rifa.valor)} • {rifa.qtd_vendida || 0}/{rifa.qtd_total} vendidos
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      rifa.status === 'ativa' 
                        ? 'bg-success-100 text-success-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rifa.status === 'ativa' ? 'Ativa' : 'Finalizada'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma rifa criada ainda</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Métricas Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Próximos Sorteios</h4>
          </div>
          
          <div className="space-y-2">
            {rifas
              .filter(r => r.status === 'ativa' && r.data_sorteio)
              .sort((a, b) => new Date(a.data_sorteio?.toDate?.() || a.data_sorteio) - new Date(b.data_sorteio?.toDate?.() || b.data_sorteio))
              .slice(0, 3)
              .map((rifa, index) => (
                <div key={rifa.id} className="text-sm">
                  <p className="font-medium text-gray-900 truncate">
                    {rifa.titulo}
                  </p>
                  <p className="text-gray-500">
                    {new Date(rifa.data_sorteio?.toDate?.() || rifa.data_sorteio).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))
            }
            
            {rifas.filter(r => r.status === 'ativa').length === 0 && (
              <p className="text-gray-500 text-sm">Nenhum sorteio agendado</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-success-100 rounded-lg">
              <Award className="w-5 h-5 text-success-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Top Rifas</h4>
          </div>
          
          <div className="space-y-2">
            {rifas
              .sort((a, b) => (b.qtd_vendida || 0) - (a.qtd_vendida || 0))
              .slice(0, 3)
              .map((rifa, index) => (
                <div key={rifa.id} className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900 truncate">
                    {rifa.titulo}
                  </span>
                  <span className="text-gray-500">
                    {rifa.qtd_vendida || 0} vendidos
                  </span>
                </div>
              ))
            }
            
            {rifas.length === 0 && (
              <p className="text-gray-500 text-sm">Nenhuma rifa disponível</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Activity className="w-5 h-5 text-warning-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Atividade Recente</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <p className="text-gray-500">• Nova rifa criada há 2 horas</p>
            <p className="text-gray-500">• 15 números vendidos hoje</p>
            <p className="text-gray-500">• 3 novos usuários cadastrados</p>
            <p className="text-gray-500">• 2 sorteios realizados esta semana</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;


