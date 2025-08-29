import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { LineChart, BarChart3 } from 'lucide-react';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SalesChart = ({ rifas = [], pedidos = [], periodo = 30, mostrarDadosExemplo = false }) => {
  const [tipoGrafico, setTipoGrafico] = useState('line');

  // Calcular dados baseado no período selecionado
  const calcularDadosVendas = () => {
    // Se mostrarDadosExemplo está ativo e não há vendas reais, usar dados de exemplo
    if (mostrarDadosExemplo) {
      // Primeiro verificar se há vendas reais
      const vendasReais = pedidos.filter(pedido => pedido.status_pagamento === 'pago').length;
      
      // Se não há vendas reais, usar dados de exemplo
      if (vendasReais === 0) {
      const mostrarPorDias = periodo <= 30;
      const labels = [];
      const totalPontos = mostrarPorDias ? periodo : Math.ceil(periodo / 30);
      
      // Gerar labels
      if (mostrarPorDias) {
        const agora = new Date();
        for (let i = periodo - 1; i >= 0; i--) {
          const data = new Date(agora.getTime() - (i * 24 * 60 * 60 * 1000));
          const dataStr = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          labels.push(dataStr);
        }
      } else {
        const mesesParaMostrar = Math.ceil(periodo / 30);
        for (let i = mesesParaMostrar - 1; i >= 0; i--) {
          const data = new Date();
          data.setMonth(data.getMonth() - i);
          const nomeMonth = data.toLocaleDateString('pt-BR', { month: 'short' });
          labels.push(nomeMonth.charAt(0).toUpperCase() + nomeMonth.slice(1));
        }
      }
      
      // Gerar dados de exemplo
      const dadosExemplo = [];
      const participantesExemplo = [];
      
      for (let i = 0; i < totalPontos; i++) {
        // Valores crescentes: 0, 10.000, 20.000, 30.000... até 100.000
        const valorCrescente = Math.floor((i / (totalPontos - 1)) * 100000);
        
        // Participantes crescentes: 0, 5, 10, 15... até 50
        const participantesCrescente = Math.floor((i / (totalPontos - 1)) * 50);
        
        dadosExemplo.push(valorCrescente);
        participantesExemplo.push(participantesCrescente);
      }
      
      return { labels, valores: dadosExemplo, participantes: participantesExemplo };
      }
    }
    
    // Lógica original para dados reais
    const agora = new Date();
    const dataInicio = new Date(agora.getTime() - (periodo * 24 * 60 * 60 * 1000));
    
    // Determinar se vamos mostrar por dias ou meses
    const mostrarPorDias = periodo <= 30;
    const labels = [];
    const valores = [];
    const participantes = [];
    
    if (mostrarPorDias) {
      // Mostrar por dias
      for (let i = periodo - 1; i >= 0; i--) {
        const data = new Date(agora.getTime() - (i * 24 * 60 * 60 * 1000));
        const dataStr = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        labels.push(dataStr);
        
        // Calcular vendas do dia baseado nos pedidos pagos
        const vendasDia = pedidos
          .filter(pedido => pedido.status_pagamento === 'pago')
          .reduce((total, pedido) => {
            if (!pedido.data_criacao) return total;
            
            const pedidoData = pedido.data_criacao?.toDate ? 
              pedido.data_criacao.toDate() : 
              new Date(pedido.data_criacao);
            
            if (pedidoData.toDateString() === data.toDateString()) {
              return total + (pedido.valor_total || 0);
            }
            return total;
          }, 0);
        
        // Calcular participantes do dia (usuários únicos que fizeram pedidos pagos)
        const participantesDia = new Set(
          pedidos
            .filter(pedido => pedido.status_pagamento === 'pago')
            .filter(pedido => {
              if (!pedido.data_criacao) return false;
              
              const pedidoData = pedido.data_criacao?.toDate ? 
                pedido.data_criacao.toDate() : 
                new Date(pedido.data_criacao);
              
              return pedidoData.toDateString() === data.toDateString();
            })
            .map(pedido => pedido.id_usuario)
        ).size;
        
        valores.push(vendasDia);
        participantes.push(participantesDia);
      }
    } else {
      // Mostrar por meses (para períodos maiores)
      const mesesParaMostrar = Math.ceil(periodo / 30);
      
      for (let i = mesesParaMostrar - 1; i >= 0; i--) {
        const data = new Date();
        data.setMonth(data.getMonth() - i);
        
        const nomeMonth = data.toLocaleDateString('pt-BR', { month: 'short' });
        labels.push(nomeMonth.charAt(0).toUpperCase() + nomeMonth.slice(1));
        
        // Calcular vendas do mês baseado nos pedidos pagos
        const vendasMes = pedidos
          .filter(pedido => pedido.status_pagamento === 'pago')
          .reduce((total, pedido) => {
            if (!pedido.data_criacao) return total;
            
            const pedidoData = pedido.data_criacao?.toDate ? 
              pedido.data_criacao.toDate() : 
              new Date(pedido.data_criacao);
            
            if (pedidoData.getMonth() === data.getMonth() && 
                pedidoData.getFullYear() === data.getFullYear()) {
              return total + (pedido.valor_total || 0);
            }
            return total;
          }, 0);
        
        // Calcular participantes do mês
        const participantesMes = new Set(
          pedidos
            .filter(pedido => pedido.status_pagamento === 'pago')
            .filter(pedido => {
              if (!pedido.data_criacao) return false;
              
              const pedidoData = pedido.data_criacao?.toDate ? 
                pedido.data_criacao.toDate() : 
                new Date(pedido.data_criacao);
              
              return pedidoData.getMonth() === data.getMonth() && 
                     pedidoData.getFullYear() === data.getFullYear();
            })
            .map(pedido => pedido.id_usuario)
        ).size;
        
        valores.push(vendasMes);
        participantes.push(participantesMes);
      }
    }
    
    return { labels, valores, participantes };
  };

  const dadosCalculados = calcularDadosVendas();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3B82F6',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              return `Vendas: R$ ${context.parsed.y.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}`;
            } else {
              return `Participantes: ${context.parsed.y} pessoas`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 11
          },
          callback: function(value) {
            return 'R$ ' + value.toLocaleString('pt-BR');
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      },
      line: {
        tension: 0.4
      }
    }
  };

  const data = {
    labels: dadosCalculados.labels,
    datasets: [
      {
        label: 'Vendas (R$)',
        data: dadosCalculados.valores,
        backgroundColor: tipoGrafico === 'bar' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 3,
        tension: 0.4,
        fill: tipoGrafico === 'line',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        yAxisID: 'y'
      },
      {
        label: 'Participantes',
        data: dadosCalculados.participantes,
        backgroundColor: tipoGrafico === 'bar' ? 'rgba(16, 185, 129, 0.6)' : 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 3,
        tension: 0.4,
        fill: tipoGrafico === 'line',
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        yAxisID: 'y1'
      }
    ],
  };

  const totalVendas = dadosCalculados.valores.reduce((sum, valor) => sum + valor, 0);
  const totalParticipantes = dadosCalculados.participantes.reduce((sum, valor) => sum + valor, 0);
  
  // Calcular média de forma mais inteligente
  let mediaVendas;
  if (mostrarDadosExemplo && pedidos.filter(pedido => pedido.status_pagamento === 'pago').length === 0) {
    // Se são dados de exemplo, usar uma média mais realista
    mediaVendas = 50000; // R$ 50.000 como média para dados de exemplo
  } else {
    // Se são dados reais, calcular a média normal
    mediaVendas = totalVendas / dadosCalculados.valores.length;
  }

  return (
    <div className="space-y-4">
      {/* Controles do Gráfico */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Total: </span>
          <span className="text-blue-600 font-semibold">
            R$ {totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="mx-2">•</span>
          <span className="text-green-600 font-semibold">
            {totalParticipantes} participantes
          </span>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setTipoGrafico('line')}
            className={`p-2 rounded-lg transition-colors ${
              tipoGrafico === 'line'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Gráfico de Linha"
          >
            <LineChart className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTipoGrafico('bar')}
            className={`p-2 rounded-lg transition-colors ${
              tipoGrafico === 'bar'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Gráfico de Barras"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-64 relative">
        {dadosCalculados.valores.every(v => v === 0) && !mostrarDadosExemplo ? (
          <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhuma venda registrada</p>
              <p className="text-sm text-gray-400">
                Os dados aparecerão quando houver vendas
              </p>
            </div>
          </div>
        ) : tipoGrafico === 'line' ? (
          <Line data={data} options={options} />
        ) : (
          <Bar data={data} options={options} />
        )}
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div className="bg-blue-50 p-3 rounded-lg">
                     <p className="text-blue-600 font-semibold">
             R$ {mediaVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
           </p>
          <p className="text-blue-500 text-xs">Média mensal</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-green-600 font-semibold">
            {Math.max(...dadosCalculados.valores).toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            })}
          </p>
          <p className="text-green-500 text-xs">Melhor mês</p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-purple-600 font-semibold">
            {Math.max(...dadosCalculados.participantes)}
          </p>
          <p className="text-purple-500 text-xs">Mais participantes</p>
        </div>
      </div>
    </div>
  );
};

export default SalesChart;


