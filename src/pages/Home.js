import React, { useEffect, useState } from 'react';
import { useRaffle } from '../contexts/RaffleContext';

// Estilos CSS para animação suave
const pulseStyles = `
  @keyframes smoothPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  
  .smooth-pulse {
    animation: smoothPulse 2s ease-in-out infinite;
  }
`;

const Home = () => {
  const { rifas, loading, buscarRifasAtivas } = useRaffle();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    buscarRifasAtivas();
  }, []);

  // Slideshow automático para a rifa principal
  useEffect(() => {
    if (rifas.length > 0 && rifas[0].imagens && rifas[0].imagens.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % rifas[0].imagens.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [rifas]);

  const MainRaffle = ({ rifa }) => {
    const hasMultipleImages = rifa.imagens && rifa.imagens.length > 1;

    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8 max-w-md mx-auto">
        {/* Imagem Principal / Slideshow */}
        <div className="relative h-64">
          {hasMultipleImages ? (
            <div className="relative w-full h-full">
              {rifa.imagens.map((img, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`${rifa.titulo} - ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              
              {/* Indicadores */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {rifa.imagens.map((_, index) => (
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
          ) : (
            <img 
              src={rifa.imagem || 'https://via.placeholder.com/400x400/3B82F6/FFFFFF?text=Rifa'} 
              alt={rifa.titulo}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        {/* Título e Botão */}
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{rifa.titulo}</h2>
          
          <button 
            className="w-full bg-black hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
            onClick={() => window.location.href = `/rifa/${rifa.id}`}
          >
            Participar Agora
          </button>
        </div>
      </div>
    );
  };

  const OtherRaffles = ({ rifas }) => {
    if (rifas.length === 0) return null;

    return (
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Outras Rifas Disponíveis</h3>
        <div className="space-y-4">
                     {rifas.map(rifa => {
             // Determinar status da rifa
             let statusText, statusClass;
             
             if (rifa.numero_sorteado || rifa.status === 'finalizada') {
                statusText = 'Encerrada';
                statusClass = 'text-red-600';
              } else if ((rifa.qtd_vendida || 0) >= (rifa.qtd_total || 0)) {
                statusText = 'Esgotou!';
                statusClass = 'text-yellow-600';
              } else {
                statusText = 'Adquirir';
                statusClass = 'text-green-600';
              }

            return (
              <div key={rifa.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex">
                  {/* Imagem pequena */}
                  <div className="w-24 h-24 flex-shrink-0">
                    <img 
                      src={rifa.imagem || rifa.imagens?.[0] || 'https://via.placeholder.com/100x100/3B82F6/FFFFFF?text=Rifa'} 
                      alt={rifa.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Informações */}
                  <div className="flex-1 p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{rifa.titulo}</h4>
                      <p className="text-sm text-gray-600 mb-1">{rifa.descricao}</p>
                                             <div className={`text-sm font-semibold smooth-pulse ${statusClass}`}>
                         {statusText}
                       </div>
                    </div>
                    
                                         <button 
                       className="bg-black hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-sm"
                       onClick={() => window.location.href = `/rifa/${rifa.id}`}
                     >
                       Ver
                     </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Carregando rifas...</div>
      </div>
    );
  }

  if (rifas.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">
          <h3 className="text-xl font-semibold mb-2">Nenhuma rifa disponível no momento</h3>
          <p>Volte em breve para novas oportunidades!</p>
        </div>
      </div>
    );
  }

  const mainRaffle = rifas[0];
  const otherRaffles = rifas.slice(1);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Estilos CSS para animação */}
      <style>{pulseStyles}</style>
      
      {/* Rifa Principal */}
      <MainRaffle rifa={mainRaffle} />
      
      {/* Outras Rifas */}
      <OtherRaffles rifas={otherRaffles} />
    </div>
  );
};

export default Home;
