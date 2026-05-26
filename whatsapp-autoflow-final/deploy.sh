#!/bin/bash
# ════════════════════════════════════════════════════════════════
#  WhatsApp AutoFlow - Script de Deploy Automático
#  Resolve pastas aninhadas, builda e inicia tudo sozinho
# ════════════════════════════════════════════════════════════════

set -e

echo "════════════════════════════════════════════"
echo "  WhatsApp AutoFlow - Deploy Automático"
echo "════════════════════════════════════════════"
echo ""

# ── Detectar comando do docker compose ──────────────────────────
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "❌ Docker Compose não encontrado. Instale o Docker primeiro."
  exit 1
fi
echo "✅ Usando: $DC"

# ── Encontrar a pasta CERTA (a que tem o docker-compose.yml) ────
# Resolve o problema de pastas aninhadas automaticamente
echo ""
echo "🔍 Procurando a pasta com docker-compose.yml..."

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Se não tiver docker-compose aqui, procurar para baixo
if [ ! -f "docker-compose.yml" ]; then
  FOUND=$(find . -maxdepth 5 -name "docker-compose.yml" 2>/dev/null | head -1)
  if [ -n "$FOUND" ]; then
    cd "$(dirname "$FOUND")"
  else
    echo "❌ docker-compose.yml não encontrado!"
    exit 1
  fi
fi

# Descer por pastas aninhadas iguais (whatsapp-autoflow-final/whatsapp-autoflow-final/...)
while [ ! -d "./api" ] || [ ! -d "./wa-gateway" ]; do
  SUB=$(find . -maxdepth 2 -name "docker-compose.yml" 2>/dev/null | grep -v "^./docker-compose.yml$" | head -1)
  [ -z "$SUB" ] && break
  cd "$(dirname "$SUB")"
done

echo "✅ Pasta do projeto: $(pwd)"
echo ""

# ── Confirmar estrutura ─────────────────────────────────────────
echo "📂 Verificando estrutura..."
MISSING=0
for item in api wa-gateway web worker docker-compose.yml; do
  if [ -e "$item" ]; then
    echo "   ✅ $item"
  else
    echo "   ❌ $item (FALTANDO)"
    MISSING=1
  fi
done

if [ "$MISSING" = "1" ]; then
  echo ""
  echo "❌ Estrutura incompleta. Verifique os arquivos."
  exit 1
fi
echo ""

# ── Parar containers antigos (se houver) ────────────────────────
echo "🛑 Parando containers antigos (se existirem)..."
$DC down 2>/dev/null || true
echo ""

# ── Build ───────────────────────────────────────────────────────
echo "🔨 Buildando imagens (pode demorar alguns minutos)..."
$DC build
echo ""

# ── Start ───────────────────────────────────────────────────────
echo "🚀 Iniciando serviços..."
$DC up -d
echo ""

# ── Aguardar e verificar ────────────────────────────────────────
echo "⏳ Aguardando containers iniciarem (15s)..."
sleep 15
echo ""
echo "📊 Status dos containers:"
$DC ps
echo ""

# ── Descobrir IP ────────────────────────────────────────────────
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$IP" ] && IP="SEU_IP"

echo "════════════════════════════════════════════"
echo "  ✅ DEPLOY CONCLUÍDO!"
echo "════════════════════════════════════════════"
echo ""
echo "🌐 Acesse: http://$IP:3025"
echo ""
echo "🔑 Login:"
echo "   Email: admin@admin.com"
echo "   Senha: Admin#123456"
echo ""
echo "📋 Comandos úteis:"
echo "   $DC ps              → ver status"
echo "   $DC logs -f         → ver logs"
echo "   $DC logs -f wa-gateway  → logs do WhatsApp"
echo "   $DC restart wa-gateway  → reiniciar gateway"
echo "   $DC down            → parar tudo"
echo ""
echo "📱 Próximo passo: Acesse a aba WhatsApp e escaneie o QR Code"
echo "════════════════════════════════════════════"
