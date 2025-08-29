import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Copy, 
  Clock, 
  CheckCircle, 
  X,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import QRCodeReact from 'qrcode.react';
import { useRaffle } from '../../contexts/RaffleContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';

const PaymentModal = ({ pedido, rifa, onClose }) => {
  const { 
    gerarPIX, 
    verificarStatusPagamento, 
    cancelarPedido 
  } = useRaffle();
  
  const [qrCodeData, setQrCodeData] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ minutes: 15, seconds: 0 }); // SEMPRE começa com 15 min
  const [loading, setLoading] = useState(false);
  const [pixGerado, setPixGerado] = useState(false);
  const [resumoExpandido, setResumoExpandido] = useState(false);

  // Timer CORRIGIDO - usando data de expiração real
  useEffect(() => {
    if (!pedido) return;
    
    // Calcular tempo restante baseado na data de expiração real
    const calcularTempoRestante = () => {
      const agora = new Date();
      const dataExpiracao = pedido.data_expiracao?.toDate ? 
        pedido.data_expiracao.toDate() : 
        new Date(pedido.data_expiracao);
      
      const tempoRestante = Math.max(0, Math.floor((dataExpiracao - agora) / 1000));
      
      if (tempoRestante <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0 });
        return false;
      }
      
      const minutes = Math.floor(tempoRestante / 60);
      const seconds = tempoRestante % 60;
      setTimeLeft({ minutes, seconds });
      return true;
    };
    
    // Calcular tempo inicial
    const aindaTemTempo = calcularTempoRestante();
    
    if (aindaTemTempo) {
    const timer = setInterval(() => {
        const aindaTemTempo = calcularTempoRestante();
        if (!aindaTemTempo) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
    }
  }, [pedido]);

  // Gerar QR Code PIX quando modal abre
  useEffect(() => {
    if (pedido && !qrCodeData && !pixGerado) {
      handleGeneratePIX();
    }
  }, [pedido]);

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (!pedido || pedido.status_pagamento === 'pago') return;

    const checkInterval = setInterval(async () => {
      const isPaid = await verificarStatusPagamento(pedido.id);
      if (isPaid) {
        onClose();
      }
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(checkInterval);
  }, [pedido]);

  const handleGeneratePIX = async () => {
    if (pixGerado || qrCodeData) {
      return; // Já foi gerado, não gerar novamente
    }
    
    setLoading(true);
    try {
      const qrCode = await gerarPIX(pedido.id);
      if (qrCode) {
        setQrCodeData(qrCode);
        setPixGerado(true);
        toast.success('PIX gerado com sucesso! Escaneie o QR Code para pagar.', { id: 'unique-toast' });
      }
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      toast.error('Erro ao gerar código PIX', { id: 'unique-toast' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPIXCode = () => {
    if (qrCodeData?.qr_code) {
      navigator.clipboard.writeText(qrCodeData.qr_code);
      toast.success('Código PIX copiado!');
    }
  };

  const handleExpiredOrder = async () => {
    try {
      await cancelarPedido(pedido.id);
      onClose();
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
    }
  };

  const handleCloseModal = async () => {
    if (!isPaid && !isExpired) {
      // Se não foi pago e não expirou, cancelar o pedido
      try {
        await cancelarPedido(pedido.id);
      } catch (error) {
        console.error('Erro ao cancelar pedido:', error);
      }
    }
    onClose();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!pedido) return null;

  // Verificar se expirou baseado na data real
  const agora = new Date();
  const dataExpiracao = pedido.data_expiracao?.toDate ? 
    pedido.data_expiracao.toDate() : 
    new Date(pedido.data_expiracao);
  
  const isExpired = agora > dataExpiracao && pedido.status_pagamento !== 'pago';
  const isPaid = pedido.status_pagamento === 'pago';

  return (
    <Modal
      isOpen={true}
      onClose={handleCloseModal}
      size="md"
      closeOnOverlay={false}
      hideClose={false}
      title="Escaneie o QR Code"
    >
      <div className="space-y-6">
        {/* Status */}
        <div className="text-center">
          {isPaid ? (
            <div className="text-success-600">
              <p className="text-gray-600">
                Seus números foram reservados com sucesso.
              </p>
            </div>
          ) : isExpired ? (
            <div className="text-danger-600">
              <p className="text-gray-600">
                O tempo para pagamento expirou. Os números voltaram a ficar disponíveis.
              </p>
            </div>
          ) : (
            <div className="text-primary-600">
              <p className="text-gray-600">
                Use o aplicativo do seu banco para escanear o código PIX
              </p>
            </div>
          )}
        </div>

        {/* QR Code - MOVIDO PARA O TOPO */}
        {!isPaid && !isExpired && (
          <div className="text-center">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="loading-spinner w-6 h-6" />
                <span className="ml-3 text-gray-600">Gerando código PIX...</span>
              </div>
            ) : qrCodeData ? (
              <div className="space-y-4">
                {/* QR Code Visual */}
                <div className="bg-white p-6 rounded-lg inline-block border-2 border-gray-100">
                  <QRCodeReact
                    value={qrCodeData.qr_code}
                    size={200}
                    level="M"
                    includeMargin
                  />
                </div>

                {/* Código PIX para copiar */}
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCopyPIXCode}
                    fullWidth
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Código PIX
                  </Button>
                  
                  {/* Timer compacto */}
                  {timeLeft && timeLeft.minutes > 0 && (
                    <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-warning-700">
                        {String(timeLeft.minutes).padStart(2, '0')}:
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">
                  Erro ao gerar código PIX
                </p>
                <Button
                  variant="primary"
                  onClick={handleGeneratePIX}
                  loading={loading}
                >
                  Tentar Novamente
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Resumo do Pedido */}
        <Card className="bg-gray-50">
          <button
            onClick={() => setResumoExpandido(!resumoExpandido)}
            className="w-full flex items-center justify-between text-left"
          >
            <h4 className="font-semibold text-gray-900">Resumo do Pedido</h4>
            <ChevronDown 
              className={`w-5 h-5 text-gray-500 transition-transform ${
                resumoExpandido ? 'rotate-180' : ''
              }`} 
            />
          </button>
          
          {resumoExpandido && (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Rifa:</span>
                <span className="font-medium">{rifa?.titulo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Números:</span>
                <span className="font-medium">{pedido.numeros?.length || pedido.quantidade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor unitário:</span>
                <span className="font-medium">{formatCurrency(rifa?.valor || 0)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-primary-600">
                    {formatCurrency(pedido.valor_total)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Números Reservados */}
        {pedido.numeros && pedido.numeros.length > 0 && (
          <Card className="bg-primary-50">
            <h4 className="font-semibold text-primary-900 mb-3">
              Seus Números Reservados
            </h4>
            <div className="flex flex-wrap gap-2">
              {pedido.numeros.map((numero, index) => (
                <span
                  key={index}
                  className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium"
                >
                  {String(numero).padStart(4, '0')}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isPaid || isExpired ? (
            <Button
              variant="primary"
              onClick={handleCloseModal}
              fullWidth
            >
              Fechar
            </Button>
          ) : null}
        </div>

        {/* Instruções */}
        {!isPaid && !isExpired && (
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>• Abra o aplicativo do seu banco</p>
            <p>• Escaneie o QR Code ou cole o código PIX</p>
            <p>• Confirme o pagamento</p>
            <p>• A confirmação é automática em até 2 minutos</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PaymentModal;
