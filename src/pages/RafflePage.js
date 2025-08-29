import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Plus, 
  Minus, 
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useRaffle } from '../contexts/RaffleContext';
import AuthModal from '../components/auth/AuthModal';
import PaymentModal from '../components/payment/PaymentModal';
import MyRaffleTickets from '../components/raffle/MyRaffleTickets';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';

const RafflePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    rifaAtiva, 
    pedidoAtivo,
    numerosRifa,
    loading, 
    buscarRifa,
    comprarNumeros,
    getNumerosDisponiveis,
    getNumerosVendidos
  } = useRaffle();

  const [quantidade, setQuantidade] = useState(1);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMyTicketsModalOpen, setIsMyTicketsModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [lastClickedButton, setLastClickedButton] = useState(null);
  const [lastErrorMessage, setLastErrorMessage] = useState('');

  useEffect(() => {
    if (id) {
      buscarRifa(id);
    }
  }, [id]);

  // Slideshow automático
  useEffect(() => {
    if (rifaAtiva?.imagens && rifaAtiva.imagens.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % rifaAtiva.imagens.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [rifaAtiva]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return 'Data não definida';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getTotalPrice = () => {
    return rifaAtiva?.valor * quantidade || 0;
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantidade + delta;
    const maxAvailable = getNumerosDisponiveis(rifaAtiva?.id) || 1000;
    const valorPorNumero = rifaAtiva?.valor || 45;
    const valorMaximoCompra = 5000; // R$ 5.000,00 máximo por compra
    const maxNumerosPorValor = Math.floor(valorMaximoCompra / valorPorNumero);
    const maxPermitido = Math.min(maxAvailable, maxNumerosPorValor);
    
    if (newQuantity >= 1) {
      if (newQuantity <= maxPermitido) {
      setQuantidade(newQuantity);
        setLastClickedButton(null);
        setLastErrorMessage(''); // Limpar mensagem anterior
      } else {
        // Se exceder o limite, ajustar para o máximo
        setQuantidade(maxPermitido);
        setLastClickedButton(null);
        const message = `Quantidade ajustada para ${maxPermitido} números`;
        if (lastErrorMessage !== message) {
          toast.success(message, { id: 'unique-toast' });
          setLastErrorMessage(message);
        }
      }
    }
  };

  const handleQuickSelect = (qty) => {
    const maxAvailable = getNumerosDisponiveis(rifaAtiva?.id) || 1000;
    const valorPorNumero = rifaAtiva?.valor || 45;
    const valorMaximoCompra = 5000; // R$ 5.000,00 máximo por compra
    const maxNumerosPorValor = Math.floor(valorMaximoCompra / valorPorNumero);
    const maxPermitido = Math.min(maxAvailable, maxNumerosPorValor);
    
    let newQty;
    
    // Se clicou no mesmo botão novamente, soma
    if (lastClickedButton === qty) {
      newQty = quantidade + qty;
    } else {
      // Se clicou em um botão diferente, soma ao valor atual
      newQty = quantidade + qty;
    }
    
    // Se exceder o limite, calcular o máximo possível
    if (newQty > maxPermitido) {
      const valorAtual = quantidade * valorPorNumero;
      const valorRestante = valorMaximoCompra - valorAtual;
      const numerosPossiveis = Math.floor(valorRestante / valorPorNumero);
      
      if (numerosPossiveis > 0) {
        newQty = quantidade + numerosPossiveis;
        const message = `Quantidade ajustada para ${numerosPossiveis} números adicionais`;
        if (lastErrorMessage !== message) {
          toast.success(message, { id: 'unique-toast' });
          setLastErrorMessage(message);
        }
      } else {
        const message = 'Limite de R$ 5.000,00 atingido';
        if (lastErrorMessage !== message) {
          toast.error(message, { id: 'unique-toast' });
          setLastErrorMessage(message);
        }
        return;
      }
    } else {
      setLastErrorMessage(''); // Limpar mensagem anterior se não há erro
    }
    
    setQuantidade(newQty);
    setLastClickedButton(qty);
  };

  // Gerar botões de seleção rápida baseado no total da rifa
  const getQuickSelectOptions = () => {
    const total = rifaAtiva?.qtd_total || 1000;
    
    if (total <= 100) {
      // Rifas pequenas: 1, 2, 3, 5, 8, 10
      return [1, 2, 3, 5, 8, Math.min(10, total)];
    } else if (total <= 500) {
      // Rifas médias: 1, 3, 5, 10, 15, 25
      return [1, 3, 5, 10, 15, Math.min(25, total)];
    } else {
      // Rifas grandes: 2, 5, 10, 20, 30, 50
      return [2, 5, 10, 20, 30, Math.min(50, total)];
    }
  };

  const handleBuyNumbers = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!rifaAtiva) {
      toast.error('Nenhuma rifa ativa encontrada');
      return;
    }

    const numerosDisponiveis = getNumerosDisponiveis(rifaAtiva.id);
    const valorPorNumero = rifaAtiva.valor || 45;
    const valorTotalCompra = quantidade * valorPorNumero;
    const valorMaximoCompra = 5000; // R$ 5.000,00 máximo por compra

    if (quantidade > numerosDisponiveis) {
      toast.error('Quantidade não disponível', { id: 'unique-toast' });
      return;
    }

    if (valorTotalCompra > valorMaximoCompra) {
      toast.error('Limite de compra atingido para esta rifa', { id: 'unique-toast' });
      return;
    }

    try {
    const pedido = await comprarNumeros(rifaAtiva.id, quantidade);
    if (pedido) {
      setIsPaymentModalOpen(true);
        setQuantidade(1);
        setLastClickedButton(null);
      }
    } catch (error) {
      console.error('Erro ao comprar números:', error);
      toast.error('Erro ao comprar números. Tente novamente.', { id: 'unique-toast' });
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    setTimeout(() => {
      handleBuyNumbers();
    }, 500);
  };

  // Verificar se há imagens
  const hasMultipleImages = rifaAtiva?.imagens && rifaAtiva.imagens.length > 1;
  const hasImages = rifaAtiva?.imagens && rifaAtiva.imagens.length > 0;
  
  // Função para verificar se é base64
  const isBase64 = (str) => {
    return str && str.startsWith('data:image');
  };
  
  // Função para obter imagem de fallback
  const getFallbackImage = () => {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjZmZmZmZmIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTI1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW0gZGEgUmlmYTwvdGV4dD4KPC9zdmc+Cg==';
  };

  if (loading && !rifaAtiva) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando rifa...</div>
      </div>
    );
  }

  if (!rifaAtiva) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            Rifa não encontrada
          </h2>
          <p className="text-gray-500 mb-6">
            A rifa que você procura não existe ou foi removida.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const available = (rifaAtiva.qtd_vendida || 0) < rifaAtiva.qtd_total ? 'Adquira já!' : 'Esgotou!';

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-md mx-auto bg-white min-h-screen">
        {/* Slideshow de Imagens */}
        <div className="relative h-80 bg-white raffle-image-container">
          {hasMultipleImages ? (
            <div className="relative w-full h-full">
              {rifaAtiva.imagens.map((img, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`${rifaAtiva.titulo} - ${index + 1}`}
                    className="w-full h-full object-cover bg-white raffle-image"
                    style={{ backgroundColor: 'white' }}
                  />
                </div>
              ))}
              
              {/* Indicadores */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {rifaAtiva.imagens.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentSlide ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : hasImages ? (
            <img 
              src={rifaAtiva.imagens[0]} 
              alt={rifaAtiva.titulo}
              className="w-full h-full object-cover bg-white raffle-image"
              style={{ backgroundColor: 'white' }}
            />
          ) : (
            <img 
              src={rifaAtiva.imagem || getFallbackImage()} 
              alt={rifaAtiva.titulo}
              className="w-full h-full object-cover bg-white raffle-image"
              style={{ backgroundColor: 'white' }}
            />
          )}
        </div>

        {/* Informações do Sorteio - Apenas se a rifa não foi encerrada */}
        {!rifaAtiva?.numero_sorteado && (
          <div className="p-4 bg-green-600 text-white">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm opacity-90">Sorteio:</span>
                <div className="font-semibold">{formatDate(rifaAtiva.data_sorteio)}</div>
              </div>
              <div className="text-right">
                <span className="text-sm opacity-90">Apenas:</span>
                <div className="text-2xl font-bold">{formatCurrency(rifaAtiva.valor)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Card Expansível da Rifa */}
        <div className="border-b">
          <button 
            onClick={() => setIsCardExpanded(!isCardExpanded)}
            className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <h2 className="text-lg font-bold text-gray-900">{rifaAtiva.titulo}</h2>
            {isCardExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {isCardExpanded && (
            <div className="p-4 bg-gray-50">
              <p className="text-gray-700">{rifaAtiva.descricao}</p>
            </div>
          )}
        </div>

        {/* Botão Meus Títulos */}
        <div className="p-4 border-b">
          <button 
            onClick={() => {
              if (!currentUser) {
                setIsAuthModalOpen(true);
                return;
              }
              setIsMyTicketsModalOpen(true);
            }}
            className="w-full bg-black hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            Meus títulos desta rifa
          </button>
        </div>

        {/* Seção de Compra - Apenas se a rifa estiver ativa */}
        {rifaAtiva?.status === 'ativa' && (
          <div className="p-4">
            <p className="text-center text-gray-600 mb-4 font-medium">
              Quanto mais títulos, mais chances de ganhar!
            </p>
          
          {/* Seleção Rápida */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {getQuickSelectOptions().map(qty => (
              <button
                key={qty}
                onClick={() => handleQuickSelect(qty)}
                className="bg-gray-100 hover:bg-black text-black hover:text-white font-semibold py-3 px-2 rounded-lg transition-colors text-center"
              >
                <div className="text-lg font-bold">+{qty}</div>
                <div className="text-xs">SELECIONAR</div>
              </button>
            ))}
          </div>

          {/* Controle Manual de Quantidade */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center border border-gray-300 rounded-lg flex-1">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantidade <= 1}
                className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <input
                type="number"
                value={quantidade}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  const maxAvailable = getNumerosDisponiveis(rifaAtiva?.id) || 1000;
                  const valorPorNumero = rifaAtiva?.valor || 45;
                  const valorMaximoCompra = 5000; // R$ 5.000,00 máximo por compra
                  const maxNumerosPorValor = Math.floor(valorMaximoCompra / valorPorNumero);
                  const maxPermitido = Math.min(maxAvailable, maxNumerosPorValor);
                  
                  if (val >= 1) {
                    if (val <= maxPermitido) {
                    setQuantidade(val);
                      setLastClickedButton(null); // Resetar o último botão clicado
                      setLastErrorMessage(''); // Limpar mensagem anterior
                    } else {
                      // Se exceder o limite, ajustar para o máximo
                      setQuantidade(maxPermitido);
                      setLastClickedButton(null);
                      const message = `Quantidade ajustada para ${maxPermitido} números`;
                      if (lastErrorMessage !== message) {
                        toast.success(message, { id: 'unique-toast' });
                        setLastErrorMessage(message);
                      }
                    }
                  }
                }}
                className="flex-1 text-center py-3 border-0 focus:ring-0 text-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="1"
                max="1000"
              />
              
              <button
                onClick={() => handleQuantityChange(1)}
                className="p-3 hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <button
              onClick={handleBuyNumbers}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors disabled:opacity-50"
            >
              {formatCurrency(getTotalPrice())}
            </button>
          </div>
      
          {/* Verificar se a rifa foi sorteada e mostrar resultado apenas se finalizada */}
          {rifaAtiva?.status === 'finalizada' && rifaAtiva?.numero_sorteado && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-yellow-800 mb-2">
                  Sorteio Realizado!
                </h4>
                <p className="text-yellow-700">
                  Número sorteado: <span className="font-bold text-xl">{rifaAtiva.numero_sorteado.toString().padStart(4, '0')}</span>
                </p>
                {rifaAtiva.vencedor_nome && (
                  <p className="text-yellow-700 mt-1">
                    Ganhador: <span className="font-semibold">{rifaAtiva.vencedor_nome}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Seção de Sorteio Encerrado - Quando a rifa foi sorteada */}
        {rifaAtiva?.numero_sorteado && (
          <div className="p-4">
            {/* Header do Sorteio Encerrado */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Sorteio encerrado!</h3>
            </div>

            {/* Card do Resultado */}
            <div className="bg-gray-50 rounded-lg p-4 text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-black rounded-full mb-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 uppercase tracking-wide mb-4">
                Este sorteio foi encerrado, clique no botão abaixo para conferir o resultado em nosso perfil oficial
              </p>
              <a 
                href="https://www.instagram.com/andre_status_/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-black hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <span>CLIQUE E CONFIRA</span>
              </a>
            </div>

            {/* Informações do Ganhador */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Informações do Ganhador</h4>
              
              <div className="space-y-3">
                {/* Data de Encerramento */}
                <div className="flex items-center bg-white rounded-lg p-3 border border-gray-200">
                  <svg className="w-5 h-5 text-gray-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">
                    Encerrado em: {rifaAtiva.data_sorteio ? formatDate(rifaAtiva.data_sorteio) : 'Data não disponível'}
                  </span>
                </div>

                {/* Número Sorteado */}
                {rifaAtiva.numero_sorteado && (
                  <div className="flex items-center bg-white rounded-lg p-3 border border-gray-200">
                    <svg className="w-5 h-5 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm text-gray-700">
                      Número Sorteado: <span className="font-semibold text-yellow-600">{rifaAtiva.numero_sorteado.toString().padStart(6, '0')}</span>
                    </span>
                  </div>
                )}

                {/* Ganhador */}
                {rifaAtiva.vencedor_nome && (
                  <div className="flex items-center bg-white rounded-lg p-3 border border-gray-200">
                    <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">
                      Ganhador: <span className="font-semibold text-green-600">{rifaAtiva.vencedor_nome}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Seção de Números Premiados - NO FINAL */}
        {rifaAtiva?.numeros_premiados && rifaAtiva.numeros_premiados.length > 0 && (
          <div className="p-4 bg-white border-b">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Números Premiados
              </h3>
              <p className="text-sm text-gray-600">
                Estes números ganham prêmios extras!
              </p>
            </div>
            
            {/* Tabela estilo Quasar */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <tbody>
                  {rifaAtiva.numeros_premiados.map((premio, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-b-0">
                      <td className="p-3">
                        <div className="flex justify-between items-start">
                          {/* Lado esquerdo - Número e Prêmio */}
                          <div className="flex-1">
                            <div className="flex items-center text-gray-900 font-bold">
                               <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                 <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                               </svg>
                               {(() => {
                                 const totalNumeros = rifaAtiva?.qtd_total || 1000;
                                 const digitos = totalNumeros.toString().length;
                                 return premio.numero.toString().padStart(digitos, '0');
                               })()}
                             </div>
                            <div className="mt-2">
                              <div className="flex items-center text-gray-700">
                                <svg className="w-6 h-6 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {premio.premio}
                                {premio.valor > 0 && (
                                  <span className="ml-2 font-semibold text-green-600">
                                    {formatCurrency(premio.valor)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Lado direito - Status */}
                           <div className="text-right">
                             {/* Verificar se o número foi comprado */}
                             {(() => {
                               const numeroComprado = numerosRifa.find(n => n.numero === premio.numero && n.status === 'vendido');
                               if (numeroComprado) {
                                 // Pegar apenas o primeiro nome
                                 const primeiroNome = numeroComprado.comprador_nome ? 
                                   numeroComprado.comprador_nome.split(' ')[0] : 'Comprador';
                                 
                                 return (
                                   <div className="flex flex-col items-center">
                                     <div className="text-sm font-semibold text-blue-800 mb-1">
                                       {primeiroNome}
                                     </div>
                                     <div className="text-xs text-gray-600">
                                       {numeroComprado.data_compra ? formatDate(numeroComprado.data_compra) : 'Data não disponível'}
                                     </div>
                                   </div>
                                 );
                               } else {
                                 return (
                                   <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                     <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                       <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                     </svg>
                                     Disponível
                                   </div>
                                 );
                               }
                             })()}
                           </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Banner de Números Automáticos - NO FINAL */}
        {rifaAtiva?.status === 'ativa' && (
          <div className="p-4 bg-yellow-50 border-b">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-yellow-800 uppercase tracking-wide">
                  Números Automáticos
                </div>
                <div className="text-sm text-yellow-700 mt-1">
                  Números escolhidos automaticamente, o site escolhe os números para você.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <Modal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Entrar na sua conta"
        size="sm"
      >
        <AuthModal 
          onSuccess={handleAuthSuccess}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </Modal>

      <AnimatePresence>
        {isPaymentModalOpen && pedidoAtivo && (
          <PaymentModal
            pedido={pedidoAtivo}
            rifa={rifaAtiva}
            onClose={() => setIsPaymentModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Modal Meus Títulos da Rifa */}
      <MyRaffleTickets
        rifa={rifaAtiva}
        isOpen={isMyTicketsModalOpen}
        onClose={() => setIsMyTicketsModalOpen(false)}
      />
    </div>
  );
};

export default RafflePage;