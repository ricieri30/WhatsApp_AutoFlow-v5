# 🚀 WhatsApp AutoFlow — Deploy

## ⚡ Deploy Rápido (1 comando)

Depois de descompactar o zip e entrar na pasta pelo terminal:

```bash
bash deploy.sh
```

O script faz tudo sozinho: encontra a pasta certa (mesmo se estiver aninhada), builda as imagens e inicia todos os serviços.

---

## 📋 Deploy Manual (se preferir)

```bash
# 1. Entrar na pasta (a que tem o docker-compose.yml)
cd whatsapp-autoflow-final

# 2. Confirmar — deve listar: api  wa-gateway  web  worker  docker-compose.yml
ls

# 3. Build + Start
docker compose build
docker compose up -d

# 4. Verificar (devem aparecer 6 containers)
docker compose ps
```

---

## 🌐 Acessar

```
http://SEU_IP:3025
```

**Login:**
- Email: `admin@admin.com`
- Senha: `Admin#123456`

Depois de logar, vá na aba **WhatsApp** e escaneie o **QR Code**.

---

## ⚠️ Estrutura Correta

A pasta de deploy DEVE ter exatamente isto (todos no mesmo nível):

```
whatsapp-autoflow-final/
├── docker-compose.yml   ← arquivo principal
├── deploy.sh            ← script de deploy automático
├── api/
├── wa-gateway/
├── web/
└── worker/
```

**Cuidado com pastas aninhadas!** Se ao descompactar você ver
`whatsapp-autoflow-final/whatsapp-autoflow-final/...`, entre até achar
a pasta que tem o `docker-compose.yml` junto das 4 subpastas.

O script `deploy.sh` resolve isso automaticamente.

---

## 🐛 Problemas Comuns

| Problema | Solução |
|----------|---------|
| `no configuration file provided` | Você não está na pasta com `docker-compose.yml`. Use `ls` para confirmar. |
| `Cannot connect to Docker daemon` | Rode `systemctl start docker` |
| Containers sobem e caem | Veja o erro: `docker compose logs api` |
| Porta 3025 em uso | `docker compose down` e tente de novo |
| QR Code não aparece | Aguarde 30s e veja `docker compose logs -f wa-gateway` |

---

## 📊 Os 6 Serviços

| Container | Função |
|-----------|--------|
| `autoflow2_mongo` | Banco de dados |
| `autoflow2_redis` | Fila de mensagens |
| `autoflow2_gateway` | Conexão WhatsApp (QR Code) |
| `autoflow2_api` | Backend / API |
| `autoflow2_worker` | Processador de tarefas |
| `autoflow2_web` | Interface (porta 3025) |

---

## ✅ O que está incluído nesta versão

- ✅ **Nomes dos contatos** corrigidos (prioriza nome real)
- ✅ **Detecção de LID** (não mostra número interno errado)
- ✅ **Nome salvo nas regras** (mostra "Ricieri" em vez do número)
- ✅ **Botões Importar / Backup** em 6 abas (Respostas Auto, Templates,
     Clientes, Esteira, Agendamentos, Automações)
