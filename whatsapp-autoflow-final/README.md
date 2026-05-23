# AutoFlow — WhatsApp Manager

Sistema profissional de automação WhatsApp com interface administrativa moderna.

## Stack

- **Frontend** — React + Vite + TailwindCSS (porta 3025)
- **API** — Express + JWT + Mongoose
- **Worker** — BullMQ (filas de mensagens)
- **wa-gateway** — Baileys (conexão WhatsApp real)
- **MongoDB** — banco de dados
- **Redis** — broker de filas

## Funcionalidades

- ✅ Conexão WhatsApp via QR Code (Baileys)
- ✅ Gestão de clientes com ciclo de assinatura mensal
- ✅ Automações recorrentes com cron + timezone
- ✅ Agendamentos pontuais (data e hora específica)
- ✅ Respostas automáticas por palavra-chave
- ✅ Templates de mensagem reutilizáveis
- ✅ Busca de contatos do WhatsApp conectado (com cache local robusto)
- ✅ Enriquecimento automático de nomes de contatos
- ✅ Suporte a mensagens de áudio (Voz/PTT) na esteira
- ✅ Notificações automáticas de vencimento
- ✅ Esteira de Onboarding (Boas-vindas) configurável
- ✅ Interface 100% em Português (PT-BR)
- ✅ Auditoria completa de ações
- ✅ Dashboard com métricas em tempo real e status de sincronização

## Deploy rápido

### 1. Configurar variáveis

```bash
cp .env.example .env
# Editar .env com suas configurações
```

### 2. Subir containers

```bash
docker compose up -d --build
```

### 3. Acessar

```
http://SEU_IP:3025
```

Login padrão: `admin@admin.com` / `Admin#123456`
> **Troque a senha após o primeiro acesso!**

## Estrutura

```
autoflow/
├── api/          # Express API + JWT + MongoDB
├── wa-gateway/   # Baileys — conexão WhatsApp
├── worker/       # BullMQ — processamento de filas
├── web/          # React SPA + Nginx
├── docker-compose.yml
└── .env.example
```

## Variáveis de ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `JWT_SECRET` | Chave para tokens JWT | `autoflow2-jwt-secret` |
| `ADMIN_EMAIL` | E-mail do admin inicial | `admin@admin.com` |
| `ADMIN_PASSWORD` | Senha do admin inicial | `Admin#123456` |
| `MIN_MESSAGE_DELAY_MS` | Delay mínimo entre mensagens | `2000` |
| `JITTER_MS` | Variação aleatória no delay | `1000` |
| `NOTICE_7D` | Mensagem aviso 7 dias antes | *configurável* |
| `NOTICE_1D` | Mensagem aviso 1 dia antes | *configurável* |
| `NOTICE_TODAY` | Mensagem aviso no dia | *configurável* |

## Diagnóstico e Observabilidade

O sistema conta com ferramentas avançadas para monitorar a sincronização:

- **Dashboard:** Exibe o horário da última sincronização e o total de contatos em cache.
- **API Diagnostics:** Endpoint `/api/whatsapp/diagnostics` (requer Token) retorna o estado detalhado do cache vs gateway.
- **Gateway Debug:** Endpoint `/debug/contacts` no gateway (porta 3333) mostra o mapa de contatos em memória.

### Comandos úteis

```bash
# Ver status dos containers
docker compose ps

# Logs da sincronização (Worker)
docker logs autoflow2_worker -f | grep Sync

# Logs do gateway (Eventos Baileys)
docker logs autoflow2_gateway -f

# Testar busca de contatos (Local Cache)
curl http://localhost:3025/api/whatsapp/contacts?q=silva \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Notas de produção

- A sessão do WhatsApp fica salva no volume `wa_auth` — persiste entre restarts
- Contatos sincronizam ~60 segundos após conectar o WhatsApp
- O job de notificações de vencimento dispara às **08:00 BRT** diariamente
