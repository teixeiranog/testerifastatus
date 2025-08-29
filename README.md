# 🎲 RifaMax - Sistema Completo de Rifas Online

Um sistema moderno e seguro para criar e gerenciar rifas online com pagamentos via PIX através do Mercado Pago.

## 🚀 Funcionalidades

### 👥 Para Usuários
- ✅ Registro e login com email/senha ou redes sociais (Google/Facebook)
- ✅ Visualização de rifas ativas com detalhes completos
- ✅ Compra de números com reserva automática (30 minutos)
- ✅ Pagamento seguro via PIX (Mercado Pago)
- ✅ Acompanhamento de tickets em tempo real
- ✅ Histórico completo de participações
- ✅ Interface responsiva e moderna

### 🔧 Para Administradores
- ✅ Dashboard completo com estatísticas
- ✅ Criação e gestão de rifas
- ✅ Upload de imagens (Cloudinary)
- ✅ Monitoramento de vendas e pagamentos
- ✅ Gestão de usuários
- ✅ Sistema de sorteio automático/manual
- ✅ Relatórios e exportação de dados

### 🛡️ Segurança e Confiabilidade
- ✅ Autenticação Firebase
- ✅ Pagamentos através do Mercado Pago
- ✅ Reserva temporária de números
- ✅ Webhooks para confirmação automática
- ✅ Logs completos de transações

## 🏗️ Arquitetura

### Frontend (React.js)
- **React 18** com Hooks modernos
- **TailwindCSS** para estilização
- **Framer Motion** para animações
- **Firebase SDK** para autenticação e dados
- **React Router** para navegação

### Backend (Firebase)
- **Firebase Auth** - Autenticação de usuários
- **Firestore** - Banco de dados NoSQL
- **Cloud Functions** - Lógica de negócio serverless
- **Firebase Hosting** - Hospedagem do frontend

### Pagamentos
- **Mercado Pago API** - Processamento de pagamentos PIX
- **Webhooks** - Confirmação automática de pagamentos

### Armazenamento de Imagens
- **Cloudinary** - Upload e otimização de imagens (alternativa gratuita ao Firebase Storage)

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Firebase
- Conta Mercado Pago (Sandbox para testes)
- Conta Cloudinary (gratuita)

## 🛠️ Instalação e Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/rifamax.git
cd rifamax
```

### 2. Instale as dependências
```bash
# Frontend
npm install

# Cloud Functions
cd functions
npm install
cd ..
```

### 3. Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative os seguintes serviços:
   - Authentication (Email/Password, Google, Facebook)
   - Firestore Database
   - Cloud Functions
   - Hosting

3. Configure as credenciais no arquivo `src/config/firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

### 4. Configuração do Mercado Pago

1. Crie uma conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Obtenha suas credenciais de teste
3. Configure as variáveis de ambiente no Firebase:

```bash
firebase functions:config:set mercadopago.access_token="TEST-SUA-ACCESS-TOKEN"
firebase functions:config:set app.url="https://seu-dominio.com"
```

### 5. Configuração do Cloudinary

1. Crie uma conta gratuita no [Cloudinary](https://cloudinary.com)
2. Configure as credenciais no arquivo `src/config/cloudinary.js`:

```javascript
export const cloudinaryConfig = {
  cloudName: 'seu-cloud-name',
  uploadPreset: 'rifa-uploads',
  apiKey: 'sua-api-key',
};
```

3. Crie um "Upload Preset" no dashboard do Cloudinary:
   - Nome: `rifa-uploads`
   - Modo: `Unsigned`
   - Pasta: `rifas`

### 6. Configuração do Firestore

Execute os comandos para criar as regras de segurança:

```bash
firebase deploy --only firestore:rules
```

Estrutura das coleções:
```
usuarios/
  - nome, email, telefone, tipo_usuario, data_criacao

rifas/
  - titulo, descricao, valor, qtd_total, qtd_vendida
  - data_sorteio, status, imagem, participantes

numeros/
  - id_rifa, numero, status, id_usuario, data_reserva, data_compra

pedidos/
  - id_usuario, id_rifa, numeros[], valor_total
  - status_pagamento, data_criacao, expira_em
```

## 🚀 Execução

### Desenvolvimento Local

1. **Frontend:**
```bash
npm start
```
Acesse: http://localhost:3000

2. **Cloud Functions (Emulador):**
```bash
cd functions
npm run serve
```

3. **Emuladores Firebase (Opcional):**
```bash
firebase emulators:start
```

### Deploy em Produção

1. **Build do Frontend:**
```bash
npm run build
```

2. **Deploy completo:**
```bash
firebase deploy
```

3. **Deploy específico:**
```bash
# Apenas Functions
firebase deploy --only functions

# Apenas Hosting
firebase deploy --only hosting

# Apenas Firestore Rules
firebase deploy --only firestore
```

## 🎯 Como Usar

### Para Administradores

1. **Primeiro Admin:**
   - Registre-se normalmente
   - Acesse o Firestore Console
   - Edite seu documento em `usuarios`
   - Altere `tipo_usuario` para `"admin"`

2. **Criar Rifa:**
   - Acesse `/admin`
   - Vá para "Rifas" → "Nova Rifa"
   - Preencha os dados e faça upload da imagem
   - Configure data do sorteio

3. **Monitorar Vendas:**
   - Dashboard mostra estatísticas em tempo real
   - Seção "Pedidos" lista todas as transações
   - Relatórios podem ser exportados

### Para Usuários

1. **Participar de Rifa:**
   - Navegue pelas rifas ativas
   - Clique em "Ver Rifa"
   - Escolha a quantidade de números
   - Faça login/cadastro se necessário
   - Confirme e pague via PIX

2. **Acompanhar Tickets:**
   - Acesse "Meus Tickets"
   - Veja status dos pagamentos
   - Acompanhe resultados dos sorteios

## 🔧 Personalização

### Temas e Cores
As cores principais podem ser alteradas no arquivo `tailwind.config.js`:

```javascript
colors: {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    // ... demais tons
  }
}
```

### Textos e Branding
- Logo e nome: `src/components/layout/Header.js`
- Footer: `src/components/layout/Footer.js`
- Títulos da página: `public/index.html`

## 📊 Monitoramento

### Logs do Firebase
```bash
firebase functions:log
```

### Logs do Mercado Pago
Acesse o painel do Mercado Pago para monitorar:
- Pagamentos processados
- Webhooks recebidos
- Erros de API

### Analytics
Configure o Google Analytics no Firebase para métricas detalhadas.

## 🔒 Segurança

### Regras do Firestore
```javascript
// Exemplo de regra para rifas
match /rifas/{document} {
  allow read: if true; // Público
  allow write: if isAdmin(); // Apenas admins
}
```

### Validação de Dados
- Todas as Cloud Functions validam entrada
- Campos obrigatórios são verificados
- Permissões são checadas por role

## 🧪 Testes

### Testes de Pagamento
1. Use as credenciais de teste do Mercado Pago
2. Números de teste para PIX:
   - CPF: 12345678909
   - Valor: Qualquer valor para teste

### Testes de Funcionalidade
```bash
# Executar testes (quando implementados)
npm test
```

## 📦 Deploy

### Variáveis de Ambiente de Produção
```bash
# Configurar credenciais de produção
firebase functions:config:set mercadopago.access_token="PROD-SUA-ACCESS-TOKEN"
firebase functions:config:set app.url="https://rifamax.com"
```

### Checklist de Deploy
- [ ] Configurar domínio personalizado
- [ ] Configurar SSL/HTTPS
- [ ] Testar webhooks em produção
- [ ] Configurar monitoramento
- [ ] Backup de dados
- [ ] Documentar procedimentos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para detalhes.

## 🆘 Suporte

### Problemas Comuns

**Erro de CORS:**
```bash
# Reinstalar CORS
cd functions
npm install cors
```

**Erro de Build:**
```bash
# Limpar cache
npm run build -- --reset-cache
```

**Problemas de Deploy:**
```bash
# Verificar configurações
firebase functions:config:get
```

### Contato
- 📧 Email: suporte@rifamax.com
- 💬 WhatsApp: (11) 99999-9999
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/rifamax/issues)

---

Desenvolvido com ❤️ para o mercado brasileiro de rifas online.
