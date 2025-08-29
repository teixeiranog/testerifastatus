import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Trophy, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ImageCarousel from '../ui/ImageCarousel';
import { optimizeImage } from '../../config/cloudinary';

const RaffleCard = ({ rifa, index }) => {
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

  const getProgressPercentage = () => {
    if (!rifa.qtd_total || rifa.qtd_vendida === undefined) return 0;
    return Math.round((rifa.qtd_vendida / rifa.qtd_total) * 100);
  };

  const isExpiringSoon = () => {
    if (!rifa.data_sorteio) return false;
    
    const sortDate = rifa.data_sorteio.toDate ? rifa.data_sorteio.toDate() : new Date(rifa.data_sorteio);
    const now = new Date();
    const timeDiff = sortDate.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    return daysDiff <= 7 && daysDiff > 0;
  };

  // Preparar URLs das imagens otimizadas
  const getOptimizedImages = () => {
    if (rifa.imagens && rifa.imagens.length > 0) {
      return rifa.imagens.map(url => optimizeImage(url, {
        width: 400,
        height: 250,
        quality: 'auto',
        crop: 'fill'
      }));
    } else if (rifa.imagem) {
      return [optimizeImage(rifa.imagem, {
        width: 400,
        height: 250,
        quality: 'auto',
        crop: 'fill'
      })];
    }
    return [];
  };

  const optimizedImages = getOptimizedImages();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="overflow-hidden h-full">
        {/* Image Carousel */}
        <div className="relative">
          <ImageCarousel
            images={optimizedImages}
            height="h-48"
            autoPlay={true}
            autoPlayInterval={4000}
            showDots={optimizedImages.length > 1}
            showArrows={optimizedImages.length > 1}
          />
          
          {/* Status Badge */}
          {isExpiringSoon() && (
            <div className="absolute top-3 left-3 bg-warning-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              <Clock className="w-3 h-3 inline mr-1" />
              Últimos dias!
            </div>
          )}
          
          {rifa.status === 'finalizada' && (
            <div className="absolute top-3 left-3 bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-medium">
              Finalizada
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {rifa.titulo}
          </h3>

          {/* Description */}
          {rifa.descricao && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {rifa.descricao}
            </p>
          )}

          {/* Price */}
          <div className="mb-4">
            <span className="text-2xl font-bold text-primary-600">
              {formatCurrency(rifa.valor)}
            </span>
            <span className="text-gray-500 ml-1">por número</span>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Vendidos: {rifa.qtd_vendida || 0}</span>
              <span>Total: {rifa.qtd_total}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            
            <div className="text-center mt-2">
              <span className="text-sm text-gray-500">
                {getProgressPercentage()}% vendido
              </span>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Sorteio: {formatDate(rifa.data_sorteio)}</span>
          </div>

          {/* Participants */}
          <div className="flex items-center text-sm text-gray-600 mb-6">
            <Users className="w-4 h-4 mr-2" />
            <span>
              {rifa.participantes || 0} participante{rifa.participantes !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Action Button */}
          <Link to={`/rifa/${rifa.id}`} className="block">
            <Button
              variant="primary"
              fullWidth
              disabled={rifa.status !== 'ativa'}
            >
              {rifa.status === 'ativa' ? 'Ver Rifa' : 'Rifa Finalizada'}
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
};

export default RaffleCard;
