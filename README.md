# 🚀 WhatsApp AutoFlow Pro v2.1

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/seu-usuario/whatsapp-autoflow-pro)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)](docker-compose.yml)
[![Node](https://img.shields.io/badge/node-18%2B-brightgreen.svg)](package.json)

Sistema profissional de automação de WhatsApp com gestão de clientes, automações, respostas automáticas e muito mais.

## 📋 Índice

- [Características](#-características)
- [Novidades v2.1](#-novidades-v21)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Deploy](#-deploy)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Documentação](#-documentação)
- [Contribuindo](#-contribuindo)
- [Suporte](#-suporte)
- [Licença](#-licença)

---

## ✨ Características

### Core Features
- ✅ **Gestão de Clientes** - CRM integrado com WhatsApp
- ✅ **Automações** - Regras automatizadas de resposta
- ✅ **Respostas Automáticas** - IA para respostas inteligentes
- ✅ **Agendamentos** - Schedule de mensagens
- ✅ **Templates** - Biblioteca de mensagens reutilizáveis
- ✅ **Auditoria** - Logs completos de todas as ações
- ✅ **Multi-instância** - Suporte a múltiplas contas WhatsApp

### Features v2.1 🆕
- ✅ **Configurações de Perfil** - Alterar senha via interface
- ✅ **Delays Configuráveis** - Anti-banimento ajustável (6-9s padrão)
- ✅ **Atividade Recente Visual** - Dashboard com ícones e cores
- ✅ **Sistema de Segurança** - Autenticação JWT melhorada
- ✅ **Performance** - Cache de configurações (5min TTL)

---

## 🆕 Novidades v2.1

### 🔐 Gestão de Perfil
```
Agora você pode alterar senha e email diretamente pela interface
- Interface moderna e intuitiva
- Validação de força de senha em tempo real
- Confirmação de senha
- Mensagens de sucesso/erro
```

### ⏱️ Delays Anti-Banimento
```
Sistema configurável para evitar bloqueios do WhatsApp
- Delay mínimo: 6 segundos (ajustável 2-60s)
- Jitter aleatório: 3 segundos (ajustável 0-10s)
- Limite diário: 100 mensagens (configurável)
- Interface visual para ajustes
```

### 📊 Dashboard Aprimorado
```
Atividade recente com visualização profissional
- Ícones coloridos por tipo de atividade
- Horários contextuais ("2 min atrás")
- Auto-atualização a cada 30s
- Scroll infinito
```

---

## 📋 Pré-requisitos

### Software Necessário
- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **Node.js** >= 18.0 (para desenvolvimento)
- **Git** >= 2.30

### Recursos Mínimos
- **CPU**: 2 cores
- **RAM**: 4GB
- **Disco**: 20GB livre
- **OS**: Linux (Ubuntu 20.04+ recomendado)

---

## 🚀 Instalação

### Instalação Rápida (Produção)

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/whatsapp-autoflow-pro.git
cd whatsapp-autoflow-pro

# 2. Configure variáveis de ambiente
cp .env.example .env
nano .env  # Edite conforme necessário

# 3. Execute o script de instalação
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# 4. Acesse o sistema
http://seu-servidor:3025
```

### Instalação Detalhada

Veja [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) para instruções completas.

---

## 📦 Deploy

### Deploy Inicial

```bash
# Executar deploy
./scripts/deploy.sh

# Verificar saúde do sistema
./scripts/health-check.sh

# Ver logs
docker-compose logs -f
```

### Atualização (v2.0 → v2.1)

```bash
# 1. Fazer backup
./scripts/backup.sh

# 2. Atualizar código
git pull origin main

# 3. Executar migrations
./scripts/migrate.sh

# 4. Rebuild containers
docker-compose up -d --build

# 5. Verificar
./scripts/health-check.sh
```

### Rollback (em caso de problemas)

```bash
# Voltar para versão anterior
./scripts/rollback.sh v2.0.0
```

---

## 📁 Estrutura do Projeto

```
whatsapp-autoflow-pro/
├── .github/                 # GitHub Actions e templates
├── docs/                    # Documentação completa
├── scripts/                 # Scripts de automação
├── features/                # Features organizadas por módulo
│   ├── settings/           # Configurações de delays
│   ├── profile/            # Perfil e autenticação
│   └── delays/             # Sistema anti-banimento
├── migrations/             # Database migrations
├── tests/                  # Testes automatizados
├── docker-compose.yml      # Orquestração Docker
├── CHANGELOG.md            # Histórico de mudanças
└── README.md               # Este arquivo
```

---

## 📚 Documentação

### Guias Principais
- [Arquitetura](docs/ARCHITECTURE.md) - Design e decisões técnicas
- [API](docs/API.md) - Referência completa da API
- [Deployment](docs/DEPLOYMENT.md) - Guia de deploy detalhado
- [Features](docs/FEATURES.md) - Documentação de features

### Guias de Desenvolvimento
- [Contribuindo](CONTRIBUTING.md) - Como contribuir
- [Changelog](CHANGELOG.md) - Histórico de versões
- [Migration Guide](docs/MIGRATION.md) - Guia de migração entre versões

---

## 🛠️ Stack Tecnológica

### Frontend
- **React** 18 + **Lucide Icons**
- **TailwindCSS** (utility-first)
- **Vite** (build tool)

### Backend
- **Node.js** 18 + **Express**
- **MongoDB** 6 (database principal)
- **Redis** 7 (cache e filas)
- **Baileys** (WhatsApp integration)

### DevOps
- **Docker** + **Docker Compose**
- **Nginx** (reverse proxy)
- **GitHub Actions** (CI/CD)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](CONTRIBUTING.md) para:
- Code of conduct
- Branch strategy (Git Flow)
- Pull request process
- Coding standards
- Testing requirements

---

## 📊 Status do Projeto

| Feature | Status | Versão |
|---------|--------|--------|
| Core System | ✅ Stable | v1.0 |
| Delays Configuráveis | ✅ Stable | v2.1 |
| Perfil/Senha | ✅ Stable | v2.1 |
| Atividade Visual | ✅ Stable | v2.1 |
| CI/CD | 🚧 In Progress | v2.2 |
| Testes E2E | 📋 Planned | v2.2 |

---

## 🐛 Reportar Bugs

Encontrou um bug? [Abra uma issue](https://github.com/seu-usuario/whatsapp-autoflow-pro/issues/new?template=bug_report.md)

---

## 💡 Solicitar Features

Tem uma ideia? [Abra uma issue](https://github.com/seu-usuario/whatsapp-autoflow-pro/issues/new?template=feature_request.md)

---

## 📞 Suporte

- **Documentação**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/whatsapp-autoflow-pro/issues)
- **Email**: suporte@autoflow.com (se aplicável)

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 🙏 Agradecimentos

- Baileys - WhatsApp Web API
- Comunidade open-source
- Todos os contribuidores

---

## 📈 Roadmap

### v2.2 (Próxima)
- [ ] Testes automatizados completos
- [ ] CI/CD com GitHub Actions
- [ ] Monitoramento com Prometheus
- [ ] Documentação em vídeo

### v3.0 (Futuro)
- [ ] Multi-tenancy
- [ ] API GraphQL
- [ ] Mobile app (React Native)
- [ ] Analytics avançado

---

<div align="center">

**Feito com ❤️ para automação profissional de WhatsApp**

[⭐ Star no GitHub](https://github.com/seu-usuario/whatsapp-autoflow-pro) | [📖 Documentação](docs/) | [🐛 Reportar Bug](https://github.com/seu-usuario/whatsapp-autoflow-pro/issues)

</div>
