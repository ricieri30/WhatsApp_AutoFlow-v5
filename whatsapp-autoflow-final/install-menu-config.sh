#!/bin/bash
#===============================================================================
# WhatsApp AutoFlow - Adicionar Menu Configurações
# Script de integração automática SEM DEPENDÊNCIA do GitHub
# Versão: 2.1.0
#===============================================================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
PROJECT_DIR="/tmp/autoflow_src/whatsapp-autoflow-final"
BACKUP_DIR="/root/backups/menu_config_$(date +%Y%m%d_%H%M%S)"

#===============================================================================
# Banner
#===============================================================================

clear
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   WhatsApp AutoFlow - Adicionar Menu Configurações   ║
║                     v2.1.0                            ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${YELLOW}IMPORTANTE:${NC} Este script modifica o código LOCAL"
echo -e "${YELLOW}GitHub será atualizado DEPOIS manualmente${NC}"
echo ""
read -p "Continuar? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}Cancelado${NC}"
  exit 1
fi

#===============================================================================
# ETAPA 1: Backup
#===============================================================================

echo ""
echo -e "${BLUE}[1/6]${NC} Criando backup..."

mkdir -p "$BACKUP_DIR"
cp -r "$PROJECT_DIR/web" "$BACKUP_DIR/" 2>/dev/null || true
cp -r "$PROJECT_DIR/api" "$BACKUP_DIR/" 2>/dev/null || true

if [ -d "$BACKUP_DIR/web" ]; then
  echo -e "${GREEN}✓${NC} Backup criado em: $BACKUP_DIR"
else
  echo -e "${RED}✗${NC} Falha ao criar backup"
  exit 1
fi

#===============================================================================
# ETAPA 2: Criar Profile.jsx
#===============================================================================

echo ""
echo -e "${BLUE}[2/6]${NC} Criando componente Profile.jsx..."

mkdir -p "$PROJECT_DIR/web/src/pages"

cat > "$PROJECT_DIR/web/src/pages/Profile.jsx" << 'PROFILEEOF'
import React, { useState } from 'react';
import { Lock, User, Mail } from 'lucide-react';

export default function Profile() {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagem, setMensagem] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(null);

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setMensagem({ tipo: 'erro', texto: 'Preencha todos os campos' });
      return;
    }

    if (novaSenha.length < 8) {
      setMensagem({ tipo: 'erro', texto: 'A nova senha deve ter no mínimo 8 caracteres' });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMensagem({ tipo: 'erro', texto: 'As senhas não conferem' });
      return;
    }

    setMensagem({ tipo: 'sucesso', texto: 'Funcionalidade em desenvolvimento' });
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold text-white'>⚙️ Configurações</h1>
      </div>

      <div className='bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6'>
        <div className='flex items-center gap-2 mb-4'>
          <Lock className='h-5 w-5 text-indigo-400'/>
          <h2 className='text-lg font-semibold text-white'>Alterar Senha</h2>
        </div>

        {mensagem && (
          <div className={`mb-4 p-3 rounded-lg ${
            mensagem.tipo === 'sucesso' 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {mensagem.tipo === 'sucesso' ? '✅' : '❌'} {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4 max-w-md'>
          <div>
            <label className='block text-sm font-medium text-slate-300 mb-2'>Senha Atual</label>
            <input
              type='password'
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              placeholder='Digite sua senha atual'
              className='w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-300 mb-2'>Nova Senha</label>
            <input
              type='password'
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder='Digite a nova senha (mín. 8 caracteres)'
              className='w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-300 mb-2'>Confirmar Nova Senha</label>
            <input
              type='password'
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder='Digite a nova senha novamente'
              className='w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors'
            />
            {confirmarSenha && novaSenha !== confirmarSenha && (
              <p className='text-xs text-red-400 mt-1'>❌ As senhas não conferem</p>
            )}
            {confirmarSenha && novaSenha === confirmarSenha && novaSenha.length >= 8 && (
              <p className='text-xs text-emerald-400 mt-1'>✅ As senhas conferem</p>
            )}
          </div>

          <button
            type='submit'
            disabled={salvando}
            className='flex items-center justify-center gap-2 w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium'
          >
            <Lock className='h-4 w-4'/>
            {salvando ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>

      <div className='bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6'>
        <div className='flex items-center gap-2 mb-4'>
          <User className='h-5 w-5 text-indigo-400'/>
          <h2 className='text-lg font-semibold text-white'>Informações da Conta</h2>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center'>
              <User className='h-5 w-5 text-indigo-400'/>
            </div>
            <div>
              <p className='text-xs text-slate-500'>Usuário</p>
              <p className='text-sm font-medium text-white'>admin</p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center'>
              <Mail className='h-5 w-5 text-indigo-400'/>
            </div>
            <div>
              <p className='text-xs text-slate-500'>Email</p>
              <p className='text-sm font-medium text-white'>admin@admin.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
PROFILEEOF

if [ -f "$PROJECT_DIR/web/src/pages/Profile.jsx" ]; then
  echo -e "${GREEN}✓${NC} Profile.jsx criado"
else
  echo -e "${RED}✗${NC} Erro ao criar Profile.jsx"
  exit 1
fi

#===============================================================================
# ETAPA 3: Modificar App.jsx
#===============================================================================

echo ""
echo -e "${BLUE}[3/6]${NC} Modificando App.jsx..."

APP_JSX="$PROJECT_DIR/web/src/App.jsx"

if [ ! -f "$APP_JSX" ]; then
  echo -e "${RED}✗${NC} App.jsx não encontrado"
  exit 1
fi

# Backup do App.jsx
cp "$APP_JSX" "$APP_JSX.backup"

# Adicionar Settings ao import do lucide-react
sed -i 's/from lucide-react/&/; s/Smartphone/Smartphone, Settings/' "$APP_JSX"

# Adicionar import do Profile após imports do lucide-react
sed -i "/from 'lucide-react'/a import Profile from './pages/Profile';" "$APP_JSX"

# Adicionar item no menu após WhatsApp
sed -i "/label='WhatsApp'.*whatsapp/a \          <SidebarItem icon={Settings} label='Configurações' active={view==='settings'} onClick={()=>setView('settings')}/>" "$APP_JSX"

# Adicionar view de settings antes do último </div> ou após view whatsapp
LINE_NUM=$(grep -n "view==='whatsapp'" "$APP_JSX" | tail -1 | cut -d: -f1)
if [ -n "$LINE_NUM" ]; then
  sed -i "${LINE_NUM}a\        {view==='settings' && <Profile/>}" "$APP_JSX"
fi

echo -e "${GREEN}✓${NC} App.jsx modificado"
echo -e "${YELLOW}  Backup salvo em: $APP_JSX.backup${NC}"

#===============================================================================
# ETAPA 4: Verificar Mudanças
#===============================================================================

echo ""
echo -e "${BLUE}[4/6]${NC} Verificando mudanças..."

if grep -q "Settings" "$APP_JSX" && grep -q "Profile" "$APP_JSX"; then
  echo -e "${GREEN}✓${NC} Import Settings adicionado"
  echo -e "${GREEN}✓${NC} Import Profile adicionado"
else
  echo -e "${RED}✗${NC} Imports não foram adicionados corretamente"
  echo -e "${YELLOW}Restaurando backup...${NC}"
  cp "$APP_JSX.backup" "$APP_JSX"
  exit 1
fi

if grep -q "label='Configurações'" "$APP_JSX"; then
  echo -e "${GREEN}✓${NC} Menu Configurações adicionado"
else
  echo -e "${RED}✗${NC} Menu não foi adicionado"
  exit 1
fi

if grep -q "view==='settings'" "$APP_JSX"; then
  echo -e "${GREEN}✓${NC} View Settings adicionada"
else
  echo -e "${RED}✗${NC} View não foi adicionada"
  exit 1
fi

#===============================================================================
# ETAPA 5: Rebuild Containers
#===============================================================================

echo ""
echo -e "${BLUE}[5/6]${NC} Reconstruindo containers..."

cd "$PROJECT_DIR"

echo -e "${YELLOW}Parando containers...${NC}"
docker-compose down

echo -e "${YELLOW}Reconstruindo e iniciando...${NC}"
docker-compose up -d --build

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Containers reconstruídos com sucesso"
else
  echo -e "${RED}✗${NC} Erro ao reconstruir containers"
  exit 1
fi

#===============================================================================
# ETAPA 6: Verificação Final
#===============================================================================

echo ""
echo -e "${BLUE}[6/6]${NC} Verificando containers..."

sleep 5

RUNNING=$(docker-compose ps | grep "Up" | wc -l)
echo -e "${GREEN}✓${NC} $RUNNING containers rodando"

docker-compose ps

#===============================================================================
# Finalização
#===============================================================================

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}║         ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!          ║${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📦 Backup:${NC} $BACKUP_DIR"
echo -e "${BLUE}🔧 Modificações:${NC}"
echo "  • Profile.jsx criado"
echo "  • App.jsx modificado"
echo "  • Menu 'Configurações' adicionado"
echo ""
echo -e "${BLUE}🌐 Acesse:${NC} http://76.13.236.166:3025"
echo ""
echo -e "${YELLOW}📝 PRÓXIMOS PASSOS (Opcional):${NC}"
echo ""
echo "1. Testar o menu Configurações no sistema"
echo "2. Atualizar GitHub manualmente:"
echo "   cd $PROJECT_DIR"
echo "   git add ."
echo "   git commit -m 'feat: adicionar menu Configurações'"
echo "   git push origin main"
echo ""
echo -e "${GREEN}✨ Sistema pronto para uso!${NC}"
