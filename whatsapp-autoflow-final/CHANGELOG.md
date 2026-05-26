# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planejado
- Testes automatizados E2E
- CI/CD com GitHub Actions
- Monitoramento com Prometheus
- Documentação em vídeo

---

## [2.1.0] - 2026-05-26

### 🎉 Adicionado
- **Tela de Configurações de Perfil**
  - Interface para alterar senha via web
  - Validação de força de senha em tempo real
  - Confirmação de senha com indicador visual
  - Mensagens de sucesso/erro amigáveis
  - Informações da conta exibidas

- **Sistema de Delays Configuráveis**
  - Interface web para ajustar delays anti-banimento
  - Delay mínimo configurável (2-60 segundos, padrão 6s)
  - Jitter aleatório configurável (0-10 segundos, padrão 3s)
  - Limite diário de mensagens (10-1000, padrão 100)
  - Preview de configuração antes de salvar
  - Teste de delays com simulação

- **Atividade Recente Visual**
  - Componente React moderno com ícones coloridos
  - Tipos de atividade diferenciados por cores
  - Horários contextuais ("2 min atrás" em vez de timestamps)
  - Auto-atualização a cada 30 segundos
  - Estados visuais (loading, empty, data)
  - Scroll suave para lista longa

- **API de Autenticação**
  - Endpoint `/api/auth/change-password` para alteração de senha
  - Endpoint `/api/auth/update-email` para atualização de email
  - Endpoint `/api/auth/me` para dados do usuário
  - Validação de senha atual antes de alterar
  - Hash bcrypt com salt rounds 10

- **API de Configurações**
  - Endpoint `/api/settings` para CRUD de configurações
  - Endpoint `/api/settings/delay-config` para delays formatados
  - Endpoint `/api/settings/test-delay` para preview de delays
  - Cache de configurações com TTL de 5 minutos
  - Validação de limites mín/máx

- **API de Atividades**
  - Endpoint `/api/activities/recent` para buscar atividades
  - Endpoint `/api/activities/log` para registrar atividades
  - Endpoint `/api/activities/clear` para limpar antigas
  - Helper `activityLogger` para registro fácil
  - Tipos padronizados de atividade

### 🔧 Modificado
- **Worker de Mensagens**
  - Agora lê delays do banco de dados em vez de .env
  - Cache de configurações para melhor performance
  - Logs mais detalhados de delays aplicados
  - Contador diário de mensagens com reset automático
  - Respeita limite configurável de mensagens/dia

### 🔒 Segurança
- Validação de força de senha (mínimo 8 caracteres)
- Hash bcrypt para todas as senhas
- Verificação de senha atual antes de alterar
- Rate limiting preparado (estrutura criada)
- Prepared statements para prevenir SQL injection

### 📚 Documentação
- README.md profissional completo
- CHANGELOG.md seguindo Keep a Changelog
- CONTRIBUTING.md com guias de contribuição
- docs/DEPLOYMENT.md com guia detalhado
- docs/ARCHITECTURE.md com decisões técnicas
- docs/API.md com referência completa
- docs/FEATURES.md com documentação de features
- docs/MIGRATION.md para migração v2.0 → v2.1

### 🛠️ Scripts
- `deploy.sh` - Deploy automatizado
- `rollback.sh` - Rollback seguro
- `backup.sh` - Backup automatizado
- `health-check.sh` - Verificação de saúde
- `migrate.sh` - Execução de migrations

### 🧪 Infraestrutura
- Estrutura de features modular (`features/`)
- Sistema de migrations versionado (`migrations/`)
- Preparado para testes (`tests/`)
- GitHub Actions ready (`.github/`)
- Environment configs padronizados

---

## [2.0.0] - 2026-04-22

### 🎉 Adicionado
- Sistema core de automação WhatsApp
- Gestão de clientes (CRM)
- Automações por regras
- Respostas automáticas
- Agendamento de mensagens
- Templates de mensagens
- Sistema de auditoria
- Dashboard com métricas

### 🔧 Modificado
- Migração de arquitetura monolítica para microserviços
- Separação em containers Docker
- MongoDB como banco principal
- Redis para cache e filas

### 🐛 Corrigido
- Problema de delay entre mensagens
- Bug de gateway não chamando API
- Conexão WhatsApp instável

---

## [1.0.0] - 2026-03-20

### 🎉 Adicionado
- Versão inicial do sistema
- Integração básica com WhatsApp
- Interface web inicial
- Sistema de login

---

## Tipos de Mudanças

- `Adicionado` para novas features
- `Modificado` para mudanças em features existentes
- `Deprecated` para features que serão removidas
- `Removido` para features removidas
- `Corrigido` para correções de bugs
- `Segurança` para vulnerabilidades corrigidas

---

## Links

- [Unreleased]: https://github.com/seu-usuario/whatsapp-autoflow-pro/compare/v2.1.0...HEAD
- [2.1.0]: https://github.com/seu-usuario/whatsapp-autoflow-pro/compare/v2.0.0...v2.1.0
- [2.0.0]: https://github.com/seu-usuario/whatsapp-autoflow-pro/compare/v1.0.0...v2.0.0
- [1.0.0]: https://github.com/seu-usuario/whatsapp-autoflow-pro/releases/tag/v1.0.0
