import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Heart, Instagram, MessageCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [configuracoes, setConfiguracoes] = useState(null);

  useEffect(() => {
    const carregarConfiguracoes = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'configuracoes', 'sistema'));
        if (configDoc.exists()) {
          setConfiguracoes(configDoc.data());
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    carregarConfiguracoes();
  }, []);

  return (
    <footer className="bg-white text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8">
          {/* Logo e Descrição */}
          <div className="text-center">
            <Link to="/" className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                <Ticket className="w-5 h-5 text-white" />
              </div>
                              <span className="text-xl font-bold text-black">RifaStatus</span>
            </Link>
            
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              A plataforma mais segura e confiável para participar de rifas online. 
              Transparência, segurança e diversão garantidas em cada sorteio.
            </p>

            {/* Redes Sociais */}
            <div className="flex justify-center space-x-4">
              {configuracoes?.geral?.instagram && (
                <a 
                  href={configuracoes.geral.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-pink-500 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {configuracoes?.geral?.whatsapp && (
                <a 
                  href={`https://wa.me/${configuracoes.geral.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-green-500 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-gray-500 text-sm">
              © {currentYear} RifaStatus. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6">
              <Link 
                to="/termos" 
                className="text-gray-500 hover:text-black transition-colors text-sm"
              >
                Termos de Uso
              </Link>
              <Link 
                to="/privacidade" 
                className="text-gray-500 hover:text-black transition-colors text-sm"
              >
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
