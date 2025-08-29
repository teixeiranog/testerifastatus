import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Users, CreditCard, FileText } from 'lucide-react';

const TermosDeUso = () => {
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
            <FileText className="w-8 h-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Termos de Uso</h1>
          </div>
          
          <p className="text-gray-600">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose max-w-none">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
              <p className="text-gray-700 mb-4">
                Ao acessar e utilizar a plataforma RifaMax, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, não deve utilizar nossos serviços.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Descrição do Serviço</h2>
              <p className="text-gray-700 mb-4">
                O RifaMax é uma plataforma online que permite a criação, gerenciamento e participação em rifas digitais. 
                Nossos serviços incluem:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Criação e gerenciamento de rifas</li>
                <li>Compra de números de rifa</li>
                <li>Processamento de pagamentos via PIX</li>
                <li>Sorteio automático de ganhadores</li>
                <li>Gestão de participantes e resultados</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Elegibilidade</h2>
              <p className="text-gray-700 mb-4">
                Para utilizar nossos serviços, você deve:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Ter pelo menos 18 anos de idade</li>
                <li>Ter capacidade legal para celebrar contratos</li>
                <li>Fornecer informações verdadeiras e precisas</li>
                <li>Respeitar as leis locais aplicáveis</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Criação de Conta</h2>
              <p className="text-gray-700 mb-4">
                Para participar das rifas, você deve criar uma conta fornecendo:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Nome completo</li>
                <li>Endereço de e-mail válido</li>
                <li>Número de telefone</li>
                <li>Senha segura</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Você é responsável por manter a confidencialidade de sua conta e senha.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Participação em Rifas</h2>
              <p className="text-gray-700 mb-4">
                Ao participar de uma rifa, você concorda com:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Pagar o valor total dos números selecionados</li>
                <li>Aceitar as regras específicas de cada rifa</li>
                <li>Reconhecer que a participação não garante vitória</li>
                <li>Respeitar o prazo de pagamento estabelecido</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Pagamentos</h2>
              <p className="text-gray-700 mb-4">
                Os pagamentos são processados através do Mercado Pago via PIX:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Os valores são cobrados em Reais (BRL)</li>
                <li>O pagamento deve ser realizado dentro do prazo estabelecido</li>
                <li>Números não pagos são automaticamente liberados</li>
                <li>Reembolsos seguem a política do Mercado Pago</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Sorteios</h2>
              <p className="text-gray-700 mb-4">
                Os sorteios são realizados de forma transparente e auditável:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Utilizamos algoritmos seguros e verificáveis</li>
                <li>Os resultados são registrados e podem ser auditados</li>
                <li>Ganhadores são notificados automaticamente</li>
                <li>Resultados são publicados na plataforma</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Responsabilidades</h2>
              <p className="text-gray-700 mb-4">
                Você concorda em não:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Utilizar a plataforma para atividades ilegais</li>
                <li>Tentar manipular sorteios ou resultados</li>
                <li>Compartilhar informações de outros usuários</li>
                <li>Utilizar bots ou scripts automatizados</li>
                <li>Realizar atividades que prejudiquem outros usuários</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitação de Responsabilidade</h2>
              <p className="text-gray-700 mb-4">
                O RifaMax não se responsabiliza por:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Perdas decorrentes de falhas técnicas</li>
                <li>Problemas de conectividade do usuário</li>
                <li>Erros de pagamento não relacionados à plataforma</li>
                <li>Danos indiretos ou consequenciais</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Modificações</h2>
              <p className="text-gray-700 mb-4">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                As alterações serão comunicadas através da plataforma e entrarão em vigor 
                imediatamente após a publicação.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contato</h2>
              <p className="text-gray-700 mb-4">
                Para dúvidas sobre estes termos, entre em contato conosco através da plataforma 
                ou pelo e-mail de suporte disponível no rodapé do site.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-500">
                Estes termos constituem o acordo completo entre você e o RifaMax 
                em relação ao uso da plataforma.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermosDeUso;

