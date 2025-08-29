import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database } from 'lucide-react';

const PoliticaPrivacidade = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Link>
          
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Política de Privacidade</h1>
          </div>
          
          <p className="text-gray-600">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose max-w-none">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introdução</h2>
              <p className="text-gray-700 mb-4">
                A RifaMax está comprometida em proteger sua privacidade. Esta Política de Privacidade 
                explica como coletamos, usamos, armazenamos e protegemos suas informações pessoais 
                quando você utiliza nossa plataforma de rifas online.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Informações que Coletamos</h2>
              <p className="text-gray-700 mb-4">
                Coletamos as seguintes informações quando você utiliza nossos serviços:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Informações Pessoais</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Número de telefone</li>
                <li>Data de nascimento (para verificação de idade)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Informações de Uso</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Histórico de participação em rifas</li>
                <li>Números comprados</li>
                <li>Histórico de pagamentos</li>
                <li>Preferências e configurações da conta</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Informações Técnicas</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Endereço IP</li>
                <li>Tipo de dispositivo e navegador</li>
                <li>Sistema operacional</li>
                <li>Dados de cookies e tecnologias similares</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Como Usamos suas Informações</h2>
              <p className="text-gray-700 mb-4">
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Criar e gerenciar sua conta</li>
                <li>Processar pagamentos e transações</li>
                <li>Realizar sorteios e determinar ganhadores</li>
                <li>Enviar notificações sobre rifas e resultados</li>
                <li>Fornecer suporte ao cliente</li>
                <li>Melhorar nossos serviços</li>
                <li>Cumprir obrigações legais</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Compartilhamento de Informações</h2>
              <p className="text-gray-700 mb-4">
                Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, 
                exceto nas seguintes situações:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Processadores de Pagamento:</strong> Para processar pagamentos via Mercado Pago</li>
                <li><strong>Prestadores de Serviços:</strong> Para hospedagem, análise e suporte técnico</li>
                <li><strong>Obrigações Legais:</strong> Quando exigido por lei ou autoridade competente</li>
                <li><strong>Proteção de Direitos:</strong> Para proteger nossos direitos e segurança</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Segurança dos Dados</h2>
              <p className="text-gray-700 mb-4">
                Implementamos medidas de segurança robustas para proteger suas informações:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Criptografia SSL/TLS para transmissão de dados</li>
                <li>Armazenamento seguro em servidores protegidos</li>
                <li>Controle de acesso rigoroso</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Backups regulares e seguros</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Retenção de Dados</h2>
              <p className="text-gray-700 mb-4">
                Mantemos suas informações pessoais pelo tempo necessário para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Fornecer nossos serviços</li>
                <li>Cumprir obrigações legais</li>
                <li>Resolver disputas</li>
                <li>Fazer cumprir nossos acordos</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Quando não precisarmos mais de suas informações, elas serão excluídas ou anonimizadas.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Seus Direitos</h2>
              <p className="text-gray-700 mb-4">
                Você tem os seguintes direitos em relação às suas informações pessoais:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Acesso:</strong> Solicitar cópia de suas informações</li>
                <li><strong>Correção:</strong> Atualizar informações incorretas</li>
                <li><strong>Exclusão:</strong> Solicitar remoção de seus dados</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>Oposição:</strong> Opor-se ao processamento de seus dados</li>
                <li><strong>Restrição:</strong> Limitar como usamos suas informações</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies e Tecnologias Similares</h2>
              <p className="text-gray-700 mb-4">
                Utilizamos cookies e tecnologias similares para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Manter você logado em sua conta</li>
                <li>Lembrar suas preferências</li>
                <li>Analisar o uso da plataforma</li>
                <li>Melhorar a experiência do usuário</li>
                <li>Fornecer funcionalidades essenciais</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Você pode controlar o uso de cookies através das configurações do seu navegador.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Menores de Idade</h2>
              <p className="text-gray-700 mb-4">
                Nossos serviços não são destinados a menores de 18 anos. Não coletamos 
                intencionalmente informações pessoais de menores de idade. Se você é pai 
                ou responsável e acredita que seu filho nos forneceu informações pessoais, 
                entre em contato conosco imediatamente.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Transferências Internacionais</h2>
              <p className="text-gray-700 mb-4">
                Suas informações podem ser transferidas e processadas em países diferentes 
                do seu país de residência. Garantimos que essas transferências são feitas 
                em conformidade com as leis de proteção de dados aplicáveis.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Alterações nesta Política</h2>
              <p className="text-gray-700 mb-4">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos 
                você sobre mudanças significativas através da plataforma ou por e-mail. 
                Recomendamos que você revise esta política regularmente.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contato</h2>
              <p className="text-gray-700 mb-4">
                Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como 
                tratamos suas informações pessoais, entre em contato conosco:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Através da plataforma RifaMax</li>
                <li>Pelo e-mail de suporte disponível no rodapé do site</li>
                <li>Pelo WhatsApp de suporte (quando disponível)</li>
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-500">
                Esta Política de Privacidade é parte integrante dos Termos de Uso da RifaMax 
                e deve ser lida em conjunto com eles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;

