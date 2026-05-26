# Guia de Contribuição

Obrigado por considerar contribuir para o WhatsApp AutoFlow Pro! 🎉

Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

- [Code of Conduct](#code-of-conduct)
- [Como Contribuir](#como-contribuir)
- [Branch Strategy](#branch-strategy)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Coding Standards](#coding-standards)
- [Testing](#testing)

---

## 📜 Code of Conduct

Este projeto adere a um Código de Conduta. Ao participar, você concorda em manter um ambiente respeitoso e inclusivo.

### Nossos Padrões

**Comportamentos Encorajados:**
- ✅ Usar linguagem acolhedora e inclusiva
- ✅ Respeitar pontos de vista diferentes
- ✅ Aceitar críticas construtivas
- ✅ Focar no que é melhor para a comunidade

**Comportamentos Inaceitáveis:**
- ❌ Linguagem ou imagens sexualizadas
- ❌ Comentários insultuosos ou depreciativos
- ❌ Assédio público ou privado
- ❌ Publicar informações privadas de outros

---

## 🤝 Como Contribuir

### Reportar Bugs

1. **Verifique** se o bug já foi reportado nas [Issues](https://github.com/seu-usuario/whatsapp-autoflow-pro/issues)
2. Se não existe, **crie uma nova issue** usando o template de bug
3. **Inclua**:
   - Descrição clara do problema
   - Passos para reproduzir
   - Comportamento esperado vs obtido
   - Screenshots (se aplicável)
   - Versão do sistema e ambiente

### Sugerir Features

1. **Verifique** se a feature já foi sugerida
2. **Crie uma issue** usando o template de feature request
3. **Descreva**:
   - Problema que resolve
   - Solução proposta
   - Alternativas consideradas
   - Contexto adicional

### Contribuir com Código

1. **Fork** o repositório
2. **Clone** seu fork
3. **Crie** uma branch para sua feature
4. **Implemente** suas mudanças
5. **Teste** completamente
6. **Commit** seguindo nossos padrões
7. **Push** para sua branch
8. **Abra** um Pull Request

---

## 🌿 Branch Strategy

Seguimos o **Git Flow** modificado:

### Branches Principais

```
main (produção)
  └── develop (desenvolvimento)
       ├── feature/* (novas features)
       ├── bugfix/* (correções)
       ├── hotfix/* (correções urgentes)
       └── release/* (preparação de release)
```

### Nomenclatura de Branches

```bash
# Features
feature/nome-da-feature
feature/settings-page
feature/delay-config

# Bug Fixes
bugfix/nome-do-bug
bugfix/login-error
bugfix/delay-calculation

# Hotfixes (urgente em produção)
hotfix/nome-do-hotfix
hotfix/security-patch
hotfix/critical-bug

# Releases
release/v2.1.0
release/v2.2.0
```

### Fluxo de Trabalho

```bash
# 1. Começar nova feature
git checkout develop
git pull origin develop
git checkout -b feature/minha-feature

# 2. Trabalhar na feature
git add .
git commit -m "feat: adicionar funcionalidade X"

# 3. Manter atualizado
git checkout develop
git pull origin develop
git checkout feature/minha-feature
git rebase develop

# 4. Finalizar
git push origin feature/minha-feature
# Abrir Pull Request para develop
```

---

## 💬 Commit Messages

Seguimos o **Conventional Commits** para mensagens padronizadas.

### Formato

```
<tipo>(<escopo>): <assunto>

<corpo opcional>

<rodapé opcional>
```

### Tipos

- `feat`: Nova feature
- `fix`: Correção de bug
- `docs`: Mudanças na documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração de código
- `perf`: Melhoria de performance
- `test`: Adição ou correção de testes
- `chore`: Tarefas de build/manutenção
- `ci`: Mudanças em CI/CD

### Exemplos

```bash
# Feature simples
feat: adicionar botão de logout

# Feature com escopo
feat(auth): adicionar autenticação JWT

# Bug fix
fix: corrigir erro de timeout no worker

# Bug fix com issue
fix: corrigir cálculo de delay (#123)

# Breaking change
feat!: remover suporte a Node 16

BREAKING CHANGE: Node 18+ agora é obrigatório
```

### Regras

- ✅ Use presente do indicativo ("adiciona" não "adicionado")
- ✅ Primeira letra minúscula
- ✅ Sem ponto final
- ✅ Máximo 72 caracteres no assunto
- ✅ Corpo e rodapé separados por linha em branco

---

## 🔄 Pull Requests

### Antes de Abrir

- [ ] Código está atualizado com `develop`
- [ ] Todos os testes passam
- [ ] Código segue os padrões do projeto
- [ ] Documentação foi atualizada
- [ ] CHANGELOG.md foi atualizado (se aplicável)

### Template de PR

```markdown
## Descrição
Breve descrição das mudanças

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Como Testar
1. Passo 1
2. Passo 2
3. Resultado esperado

## Checklist
- [ ] Código testado
- [ ] Testes passam
- [ ] Documentação atualizada
- [ ] CHANGELOG atualizado
```

### Review Process

1. **Automático**: CI/CD roda testes
2. **Manual**: Reviewer verifica:
   - Código limpo e legível
   - Lógica correta
   - Sem bugs óbvios
   - Documentação adequada
3. **Aprovação**: Mínimo 1 aprovação
4. **Merge**: Squash and merge para manter histórico limpo

---

## 🎨 Coding Standards

### JavaScript/Node.js

```javascript
// ✅ BOM
const getUserById = async (userId) => {
  if (!userId) {
    throw new Error('userId is required');
  }
  
  const user = await db.collection('users').findOne({ _id: userId });
  return user;
};

// ❌ RUIM
function getUser(id) {
  return db.collection('users').findOne({_id:id})
}
```

### Regras Gerais

- ✅ Use `const` por padrão, `let` quando necessário
- ✅ Arrow functions para callbacks
- ✅ Template literals para strings
- ✅ Async/await em vez de Promises diretas
- ✅ Destructuring quando apropriado
- ✅ Semicolons sempre
- ❌ Não use `var`
- ❌ Não deixe console.logs

### React

```jsx
// ✅ BOM - Componente funcional
import React, { useState, useEffect } from 'react';

export default function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadUser();
  }, [userId]);
  
  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await fetchUser(userId);
      setUser(data);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className='user-profile'>
      <h1>{user.name}</h1>
    </div>
  );
}

// ❌ RUIM - Componente de classe
class UserProfile extends React.Component {
  // Evite componentes de classe
}
```

### Nomenclatura

```javascript
// Variáveis e funções: camelCase
const userName = 'John';
const getUserData = () => {};

// Componentes React: PascalCase
const UserProfile = () => {};

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';

// Arquivos:
// - Componentes: PascalCase (UserProfile.jsx)
// - Utilitários: camelCase (apiClient.js)
// - Configuração: kebab-case (docker-compose.yml)
```

---

## 🧪 Testing

### Estrutura de Testes

```
tests/
├── unit/          # Testes de unidade
│   ├── models/
│   ├── services/
│   └── utils/
├── integration/   # Testes de integração
│   ├── api/
│   └── database/
└── e2e/          # Testes end-to-end
    └── flows/
```

### Exemplo de Teste

```javascript
// tests/unit/services/auth.test.js
const { changePassword } = require('../../../src/services/auth');

describe('Auth Service', () => {
  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const result = await changePassword('user123', 'oldPass', 'newPass');
      expect(result.success).toBe(true);
    });
    
    it('should fail with wrong current password', async () => {
      await expect(
        changePassword('user123', 'wrongPass', 'newPass')
      ).rejects.toThrow('Invalid current password');
    });
  });
});
```

### Executar Testes

```bash
# Todos os testes
npm test

# Apenas unit tests
npm run test:unit

# Apenas integration tests
npm run test:integration

# Com coverage
npm run test:coverage

# Watch mode (desenvolvimento)
npm run test:watch
```

### Coverage Mínimo

- **Linhas**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Statements**: 80%

---

## 📦 Dependências

### Adicionar Dependência

```bash
# Produção
npm install --save nome-pacote

# Desenvolvimento
npm install --save-dev nome-pacote
```

### Regras

- ✅ Verifique licença (MIT, Apache 2.0, etc)
- ✅ Verifique manutenção ativa
- ✅ Prefira pacotes populares
- ✅ Documente no PR por que é necessário
- ❌ Não adicione dependências desnecessárias

---

## 🚀 Deploy

Apenas mantenedores podem fazer deploy para produção.

O processo é:
1. Release branch criada de `develop`
2. Testes finais executados
3. Versão incrementada (semver)
4. Merge para `main`
5. Tag criada
6. Deploy automático via CI/CD

---

## 📞 Dúvidas?

- **Documentação**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/whatsapp-autoflow-pro/issues)
- **Discussions**: [GitHub Discussions](https://github.com/seu-usuario/whatsapp-autoflow-pro/discussions)

---

<div align="center">

**Obrigado por contribuir! 🎉**

[Voltar ao README](README.md)

</div>
