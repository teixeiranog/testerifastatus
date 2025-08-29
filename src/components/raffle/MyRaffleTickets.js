import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, 
  Target
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRaffle } from '../../contexts/RaffleContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import Modal from '../ui/Modal';

const MyRaffleTickets = ({ rifa, isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { meusTickets, loading, buscarMeusTickets } = useRaffle();
  const [ticketsRifa, setTicketsRifa] = useState([]);

  useEffect(() => {
    if (currentUser && isOpen && (!meusTickets || meusTickets.length === 0)) {
      buscarMeusTickets();
    }
  }, [currentUser, isOpen]);

  // Filtrar tickets apenas desta rifa
  useEffect(() => {
    if (meusTickets && rifa) {
      const ticketsFiltrados = meusTickets.filter(ticket => ticket.id_rifa === rifa.id);
      setTicketsRifa(ticketsFiltrados);
    }
  }, [meusTickets, rifa]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return 'Data não definida';
    
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('pt-BR');
  };

  const getTodosNumeros = () => {
    const todosNumeros = [];
    ticketsRifa.forEach(ticket => {
      if (ticket.numeros && Array.isArray(ticket.numeros)) {
        todosNumeros.push(...ticket.numeros);
      }
    });
    return todosNumeros.sort((a, b) => a - b);
  };

  const calcularValorTotal = () => {
    return ticketsRifa.reduce((total, ticket) => {
      return total + (ticket.valor_total || 0);
    }, 0);
  };

  const optimizedImageUrl = rifa?.imagens?.[0] ? rifa.imagens[0] : null;

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="lg"
      title={`Meus Títulos - ${rifa?.titulo || 'Rifa'}`}
      closeOnOverlay={false}
    >
        {loading ? (
          <Loading text="Carregando seus tickets..." />
      ) : ticketsRifa.length > 0 ? (
        <div className="space-y-6">
          {/* Seus Números */}
          <Card>
            <div className="flex items-center mb-4">
              <Target className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="text-lg font-semibold text-gray-900">
                Seus Números ({getTodosNumeros().length})
                  </h4>
            </div>
                  
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                    {getTodosNumeros().map((numero, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: idx * 0.02 }}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-bold text-center hover:bg-blue-700 transition-colors min-w-[80px] h-[45px] flex items-center justify-center"
                      >
                        {String(numero).padStart(4, '0')}
                      </motion.div>
                    ))}
                  </div>
                </Card>
        </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Nenhum ticket nesta rifa
                </h3>
                <p className="text-gray-500 mb-6">
                  Você ainda não participou desta rifa. Que tal garantir seus números?
                </p>
                <Button variant="primary" onClick={onClose}>
                  Comprar Números
                </Button>
              </motion.div>
        )}
    </Modal>
  );
};

export default MyRaffleTickets;
