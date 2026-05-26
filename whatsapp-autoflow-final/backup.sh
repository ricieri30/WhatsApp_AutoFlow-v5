#!/bin/bash
# scripts/backup.sh
# Script de backup do banco de dados antes de aplicar updates

set -e  # Para em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Iniciando backup do WhatsApp AutoFlow...${NC}\n"

# Configurações (ajuste conforme seu ambiente)
PROJECT_DIR="${PROJECT_DIR:-/home/claude/WhatsApp_AutoFlow-v5/whatsapp-autoflow-final}"
DB_PATH="${DB_PATH:-$PROJECT_DIR/data/autoflow.db}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="autoflow_backup_$TIMESTAMP"

# Criar diretório de backup se não existir
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}📁 Criando diretório de backup...${NC}"
    mkdir -p "$BACKUP_DIR"
fi

# Verificar se banco existe
if [ ! -f "$DB_PATH" ]; then
    echo -e "${RED}❌ Banco de dados não encontrado em: $DB_PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Banco encontrado: $DB_PATH${NC}"
echo -e "${YELLOW}📦 Criando backup...${NC}\n"

# Fazer backup do banco
cp "$DB_PATH" "$BACKUP_DIR/$BACKUP_NAME.db"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup criado: $BACKUP_DIR/$BACKUP_NAME.db${NC}"
    
    # Mostrar tamanho do backup
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.db" | cut -f1)
    echo -e "${GREEN}📊 Tamanho: $BACKUP_SIZE${NC}"
else
    echo -e "${RED}❌ Erro ao criar backup!${NC}"
    exit 1
fi

# Backup de arquivos de configuração (opcional)
echo -e "\n${YELLOW}📝 Fazendo backup de arquivos .env...${NC}"

if [ -f "$PROJECT_DIR/.env" ]; then
    cp "$PROJECT_DIR/.env" "$BACKUP_DIR/$BACKUP_NAME.env"
    echo -e "${GREEN}✅ .env copiado${NC}"
fi

if [ -f "$PROJECT_DIR/worker/.env" ]; then
    cp "$PROJECT_DIR/worker/.env" "$BACKUP_DIR/$BACKUP_NAME.worker.env"
    echo -e "${GREEN}✅ worker/.env copiado${NC}"
fi

if [ -f "$PROJECT_DIR/api/.env" ]; then
    cp "$PROJECT_DIR/api/.env" "$BACKUP_DIR/$BACKUP_NAME.api.env"
    echo -e "${GREEN}✅ api/.env copiado${NC}"
fi

# Compactar backup (opcional)
echo -e "\n${YELLOW}🗜️  Compactando backup...${NC}"
cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME".*

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup compactado: $BACKUP_NAME.tar.gz${NC}"
    
    # Remover arquivos individuais
    rm "$BACKUP_NAME".* 2>/dev/null || true
    
    COMPRESSED_SIZE=$(du -h "$BACKUP_NAME.tar.gz" | cut -f1)
    echo -e "${GREEN}📊 Tamanho compactado: $COMPRESSED_SIZE${NC}"
fi

# Listar backups existentes
echo -e "\n${YELLOW}📋 Backups disponíveis:${NC}"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "Nenhum backup encontrado"

# Limpeza de backups antigos (manter últimos 10)
echo -e "\n${YELLOW}🧹 Limpando backups antigos (mantendo últimos 10)...${NC}"
cd "$BACKUP_DIR"
ls -t *.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm
echo -e "${GREEN}✅ Limpeza concluída${NC}"

echo -e "\n${GREEN}🎉 Backup completo!${NC}"
echo -e "${YELLOW}📍 Local: $BACKUP_DIR/$BACKUP_NAME.tar.gz${NC}"
echo -e "\n${YELLOW}💡 Para restaurar, use:${NC}"
echo -e "   tar -xzf $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo -e "   cp $BACKUP_NAME.db $DB_PATH"
echo ""
