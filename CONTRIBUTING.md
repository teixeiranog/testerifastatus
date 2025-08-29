# 🤝 Contribuindo para o RifaMax

Agradecemos seu interesse em contribuir para o RifaMax! Este documento fornece diretrizes para contribuições.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Processo de Desenvolvimento](#processo-de-desenvolvimento)
- [Padrões de Código](#padrões-de-código)
- [Testes](#testes)
- [Pull Requests](#pull-requests)
- [Relatório de Bugs](#relatório-de-bugs)
- [Solicitação de Features](#solicitação-de-features)

## 📜 Código de Conduta

Este projeto adere ao código de conduta do Contributor Covenant. Ao participar, você é esperado a cumprir este código.

## 🚀 Como Contribuir

Existem várias maneiras de contribuir para o RifaMax:

- **Relatórios de bugs**: Encontrou um problema? Abra uma issue!
- **Solicitações de features**: Tem uma ideia legal? Compartilhe conosco!
- **Correções de código**: Viu algo que pode ser melhorado? Envie um PR!
- **Documentação**: Ajude a melhorar nossa documentação
- **Testes**: Escreva testes para aumentar a cobertura de código

## 🛠️ Configuração do Ambiente

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Git
- Conta Firebase (para desenvolvimento)
- Conta Mercado Pago (para testes de pagamento)
- Conta Cloudinary (para upload de imagens)

### Configuração Inicial

1. **Fork o repositório**
```bash
git clone https://github.com/seu-usuario/rifamax.git
cd rifamax
```

2. **Instale as dependências**
```bash
npm install
cd functions && npm install && cd ..
```

3. **Configure as variáveis de ambiente**
```bash
# Execute o script de setup
node scripts/setup.js

# Ou copie o arquivo de exemplo
cp env.example .env
# Edite o .env com suas credenciais
```

4. **Inicie os emuladores do Firebase (opcional)**
```bash
firebase emulators:start
```

5. **Inicie o projeto**
```bash
npm start
```

## 🔄 Processo de Desenvolvimento

### 1. Crie uma Branch

```bash
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/nome-do-bug
# ou
git checkout -b docs/melhoria-documentacao
```

### 2. Faça suas Alterações

- Mantenha commits pequenos e focados
- Escreva mensagens de commit claras
- Siga os padrões de código estabelecidos

### 3. Teste suas Alterações

```bash
# Execute os testes
npm test

# Verifique o lint
npm run lint

# Teste o build
npm run build
```

### 4. Commit suas Alterações

```bash
git add .
git commit -m "feat: adiciona funcionalidade X"
```

**Padrão de Commits** (Conventional Commits):
- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` alterações na documentação
- `style:` formatação, ponto e vírgula, etc
- `refactor:` refatoração de código
- `test:` adição ou correção de testes
- `chore:` tarefas de manutenção

### 5. Push e Pull Request

```bash
git push origin feature/nome-da-feature
```

Então abra um Pull Request no GitHub.

## 📝 Padrões de Código

### JavaScript/React

- Use **ES6+** features
- **React Hooks** são preferidos sobre class components
- Use **arrow functions** para callbacks
- **Destructuring** quando apropriado
- **Template literals** para strings com variáveis

```javascript
// ✅ Bom
const { user, isLoading } = useAuth();
const handleClick = () => {
  console.log(`Usuário: ${user.name}`);
};

// ❌ Evite
class MyComponent extends React.Component {
  handleClick() {
    console.log('Usuário: ' + this.props.user.name);
  }
}
```

### CSS/Styling

- Use **TailwindCSS** para estilização
- Componentes devem ser **responsivos**
- Prefira **utility classes** sobre CSS customizado
- Use **variáveis de cor** do tema

```jsx
// ✅ Bom
<div className="bg-primary-600 text-white p-4 rounded-lg hover:bg-primary-700 transition-colors">
  Conteúdo
</div>

// ❌ Evite
<div style={{ backgroundColor: '#2563eb', color: 'white', padding: '16px' }}>
  Conteúdo
</div>
```

### Estrutura de Arquivos

```
src/
├── components/
│   ├── ui/           # Componentes reutilizáveis
│   ├── layout/       # Layout components
│   └── feature/      # Componentes específicos
├── contexts/         # React contexts
├── hooks/           # Custom hooks
├── pages/           # Páginas/rotas
├── utils/           # Utilitários
└── config/          # Configurações
```

### Nomenclatura

- **Componentes**: PascalCase (`UserProfile`)
- **Funções**: camelCase (`handleSubmit`)
- **Constantes**: UPPER_SNAKE_CASE (`API_URL`)
- **Arquivos**: kebab-case (`user-profile.js`)

## 🧪 Testes

### Executando Testes

```bash
# Todos os testes
npm test

# Modo watch
npm test -- --watch

# Com coverage
npm test -- --coverage
```

### Escrevendo Testes

- **Unit tests** para funções utilitárias
- **Component tests** para componentes React
- **Integration tests** para fluxos completos

```javascript
// Exemplo de teste de componente
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 📤 Pull Requests

### Checklist para PR

- [ ] Código segue os padrões estabelecidos
- [ ] Testes passam (`npm test`)
- [ ] Build é bem-sucedido (`npm run build`)
- [ ] Documentação foi atualizada se necessário
- [ ] Commits seguem o padrão estabelecido
- [ ] Branch está atualizada com a main

### Template do PR

```markdown
## Descrição
Breve descrição das alterações realizadas.

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Como Testar
1. Execute `npm start`
2. Navegue para...
3. Clique em...
4. Verifique que...

## Screenshots (se aplicável)
Cole screenshots das alterações visuais.

## Checklist
- [ ] Meu código segue as diretrizes do projeto
- [ ] Realizei uma auto-revisão do código
- [ ] Comentei partes complexas do código
- [ ] Atualizei a documentação
- [ ] Meus commits seguem o padrão estabelecido
- [ ] Adicionei testes que comprovam que a correção/feature funciona
- [ ] Testes novos e existentes passam
```

## 🐛 Relatório de Bugs

Use o template de issue para reportar bugs:

```markdown
**Descreva o bug**
Uma descrição clara e concisa do problema.

**Para Reproduzir**
Passos para reproduzir o comportamento:
1. Vá para '...'
2. Clique em '....'
3. Role até '....'
4. Veja o erro

**Comportamento Esperado**
Uma descrição clara do que você esperava que acontecesse.

**Screenshots**
Se aplicável, adicione screenshots para ajudar a explicar o problema.

**Ambiente:**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Versão [e.g. 22]

**Contexto Adicional**
Qualquer outra informação sobre o problema.
```

## ✨ Solicitação de Features

Para solicitar novas funcionalidades:

```markdown
**A sua solicitação está relacionada a um problema?**
Uma descrição clara do problema. Ex: Fico frustrado quando [...]

**Descreva a solução que você gostaria**
Uma descrição clara e concisa do que você quer que aconteça.

**Descreva alternativas que você considerou**
Uma descrição clara de outras soluções ou features que você considerou.

**Contexto Adicional**
Qualquer outra informação ou screenshots sobre a solicitação.
```

## 📞 Comunicação

### Canais de Comunicação

- **GitHub Issues**: Para bugs e feature requests
- **GitHub Discussions**: Para discussões gerais
- **Pull Requests**: Para revisão de código

### Diretrizes de Comunicação

- Seja respeitoso e construtivo
- Use linguagem clara e objetiva
- Forneça contexto suficiente
- Seja paciente com revisões

## 🏆 Reconhecimento

Contribuidores serão reconhecidos:

- Lista de contribuidores no README
- Menção em release notes para contribuições significativas
- Badge de contribuidor no perfil GitHub

## 📚 Recursos Úteis

- [Documentação do React](https://reactjs.org/docs)
- [Documentação do Firebase](https://firebase.google.com/docs)
- [Documentação do TailwindCSS](https://tailwindcss.com/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

## ❓ Dúvidas?

Se tiver alguma dúvida, não hesite em:

1. Verificar a documentação existente
2. Procurar em issues anteriores
3. Abrir uma nova issue com a tag `question`
4. Iniciar uma discussão no GitHub Discussions

---

Obrigado por contribuir para o RifaMax! 🎉
