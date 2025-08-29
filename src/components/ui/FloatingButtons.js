import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, MessageCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const FloatingButtons = () => {
  const [configuracoes, setConfiguracoes] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const carregarConfiguracoes = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'configuracoes', 'sistema'));
        if (configDoc.exists()) {
          const dados = configDoc.data();
          setConfiguracoes(dados);
          
          // Mostrar botões se Instagram ou WhatsApp estiverem configurados
          if (dados?.geral?.instagram || dados?.geral?.whatsapp) {
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    carregarConfiguracoes();
  }, []);

  if (!isVisible || !configuracoes) {
    return null;
  }

  const handleInstagramClick = () => {
    if (configuracoes?.geral?.instagram) {
      window.open(configuracoes.geral.instagram, '_blank', 'noopener,noreferrer');
    }
  };

  const handleWhatsAppClick = () => {
    if (configuracoes?.geral?.whatsapp) {
      const numero = configuracoes.geral.whatsapp.replace(/\D/g, '');
      window.open(`https://wa.me/${numero}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-6 right-6 z-50">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col space-y-3"
          >
            {/* Instagram */}
            {configuracoes?.geral?.instagram && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleInstagramClick}
                className="w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all duration-300"
                title="Siga-nos no Instagram"
              >
                <Instagram className="w-6 h-6" />
              </motion.button>
            )}

            {/* WhatsApp */}
            {configuracoes?.geral?.whatsapp && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleWhatsAppClick}
                className="w-14 h-14 bg-green-500 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all duration-300"
                title="Fale conosco no WhatsApp"
              >
                <MessageCircle className="w-6 h-6" />
              </motion.button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FloatingButtons;
