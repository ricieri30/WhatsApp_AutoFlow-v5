#!/bin/bash
#===============================================================================
# WhatsApp AutoFlow Pro - Deploy Script
# Versão: 2.1.0
# Descrição: Script automatizado de deploy para produção
#===============================================================================

set -e  # Para em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION=$(cat "$PROJECT_DIR/VERSION" 2>/dev/null || echo "unknown")
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$PROJECT_DIR/deploy.log"

#===============================================================================
# Funções Auxiliares
#===============================================================================

log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
  exit 1
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
  echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

#===============================================================================
# Banner
#===============================================================================

show_banner() {
  clear
  echo -e "${BLUE}"
  cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║        WhatsApp AutoFlow Pro - Deploy v2.1.0         ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
EOF
  echo -e "${NC}"
}

#===============================================================================
# Verificações Pré-Deploy
#===============================================================================

check_requirements() {
  log "Verificando requisitos..."
  
  # Docker
  if ! command -v docker &> /dev/null; then
    error "Docker não está instalado"
  fi
  info "✓ Docker instalado: $(docker --version | cut -d' ' -f3)"
  
  # Docker Compose
  if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não está instalado"
  fi
  info "✓ Docker Compose instalado: $(docker-compose --version | cut -d' ' -f4)"
  
  # Git
  if ! command -v git &> /dev/null; then
    warn "Git não está instalado (não crítico)"
  else
    info "✓ Git instalado: $(git --version | cut -d' ' -f3)"
  fi
  
  # Verificar espaço em disco
  AVAILABLE_SPACE=$(df -h "$PROJECT_DIR" | awk 'NR==2 {print $4}')
  info "✓ Espaço disponível: $AVAILABLE_SPACE"
}

check_environment() {
  log "Verificando arquivos de configuração..."
  
  if [ ! -f "$PROJECT_DIR/.env" ]; then
    warn ".env não encontrado, criando do .env.example..."
    if [ -f "$PROJECT_DIR/.env.example" ]; then
      cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
      info "✓ .env criado. EDITE ANTES DE CONTINUAR!"
      read -p "Pressione Enter após editar .env..." 
    else
      error ".env.example não encontrado"
    fi
  else
    info "✓ .env encontrado"
  fi
}

#===============================================================================
# Backup
#===============================================================================

create_backup() {
  log "Criando backup..."
  
  mkdir -p "$BACKUP_DIR"
  
  BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)_v${VERSION}.tar.gz"
  BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
  
  # Backup do banco de dados (se containers estiverem rodando)
  if docker-compose ps | grep -q "Up"; then
    info "Fazendo backup do MongoDB..."
    docker-compose exec -T mongo mongodump --archive --gzip > "$BACKUP_DIR/mongo_backup_$(date +%Y%m%d_%H%M%S).gz" 2>/dev/null || warn "Backup do MongoDB falhou (não crítico se primeira instalação)"
  fi
  
  # Backup dos arquivos
  info "Compactando arquivos..."
  tar -czf "$BACKUP_PATH" \
    --exclude='node_modules' \
    --exclude='backups' \
    --exclude='.git' \
    --exclude='*.log' \
    -C "$(dirname "$PROJECT_DIR")" \
    "$(basename "$PROJECT_DIR")" 2>/dev/null || warn "Alguns arquivos não foram incluídos no backup"
  
  if [ -f "$BACKUP_PATH" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    info "✓ Backup criado: $BACKUP_NAME ($BACKUP_SIZE)"
    echo "$BACKUP_PATH" > "$PROJECT_DIR/.last_backup"
  else
    error "Falha ao criar backup"
  fi
}

#===============================================================================
# Deploy
#===============================================================================

stop_services() {
  log "Parando serviços..."
  
  cd "$PROJECT_DIR"
  
  if docker-compose ps | grep -q "Up"; then
    docker-compose down
    info "✓ Serviços parados"
  else
    info "✓ Serviços já estavam parados"
  fi
}

pull_images() {
  log "Baixando imagens Docker..."
  
  cd "$PROJECT_DIR"
  docker-compose pull || warn "Algumas imagens falharam ao baixar"
  
  info "✓ Imagens atualizadas"
}

build_services() {
  log "Construindo serviços..."
  
  cd "$PROJECT_DIR"
  docker-compose build --no-cache || error "Falha ao construir serviços"
  
  info "✓ Serviços construídos"
}

start_services() {
  log "Iniciando serviços..."
  
  cd "$PROJECT_DIR"
  docker-compose up -d || error "Falha ao iniciar serviços"
  
  info "✓ Serviços iniciados"
}

run_migrations() {
  log "Executando migrations..."
  
  # Aguardar serviços ficarem prontos
  sleep 5
  
  if [ -f "$PROJECT_DIR/scripts/migrate.sh" ]; then
    bash "$PROJECT_DIR/scripts/migrate.sh" || warn "Migrations falharam (pode ser normal em primeira instalação)"
  else
    info "✓ Nenhuma migration encontrada"
  fi
}

#===============================================================================
# Verificação Pós-Deploy
#===============================================================================

health_check() {
  log "Verificando saúde dos serviços..."
  
  # Aguardar serviços iniciarem
  sleep 10
  
  cd "$PROJECT_DIR"
  
  # Verificar containers
  CONTAINERS=$(docker-compose ps -q | wc -l)
  RUNNING=$(docker-compose ps | grep "Up" | wc -l)
  
  info "Containers: $RUNNING/$CONTAINERS rodando"
  
  # Verificar cada serviço
  docker-compose ps
  
  # Health check HTTP (se aplicável)
  if command -v curl &> /dev/null; then
    info "Testando endpoints..."
    
    # API
    if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
      info "✓ API respondendo"
    else
      warn "API não respondeu (pode levar alguns segundos para iniciar)"
    fi
    
    # Web
    if curl -f -s http://localhost:3025 > /dev/null 2>&1; then
      info "✓ Web respondendo"
    else
      warn "Web não respondeu (pode levar alguns segundos para iniciar)"
    fi
  fi
}

show_logs() {
  log "Últimas linhas dos logs:"
  echo ""
  docker-compose logs --tail=20
}

#===============================================================================
# Main
#===============================================================================

main() {
  show_banner
  
  log "Iniciando deploy v${VERSION}..."
  log "Diretório: $PROJECT_DIR"
  
  # Confirmação
  read -p "Continuar com o deploy? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "Deploy cancelado pelo usuário"
  fi
  
  # Etapas do deploy
  check_requirements
  check_environment
  create_backup
  stop_services
  pull_images
  build_services
  start_services
  run_migrations
  health_check
  
  # Finalização
  echo ""
  log "════════════════════════════════════════════════════"
  log "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
  log "════════════════════════════════════════════════════"
  echo ""
  info "Versão instalada: v${VERSION}"
  info "Backup criado: $(cat "$PROJECT_DIR/.last_backup" 2>/dev/null || echo 'N/A')"
  echo ""
  info "🌐 Acesse: http://seu-servidor:3025"
  info "📊 Dashboard: http://seu-servidor:3025/dashboard"
  info "📝 Logs: docker-compose logs -f"
  echo ""
  
  # Perguntar se quer ver logs
  read -p "Ver logs em tempo real? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose logs -f
  fi
}

# Executar
main "$@"
