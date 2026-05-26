# 🔐 GUIA: Como Trocar a Senha do Admin

## 🎯 OBJETIVO
Trocar a senha padrão `Admin#123456` por uma senha personalizada e segura.

---

## 📋 ONDE A SENHA ESTÁ ARMAZENADA?

A senha do admin geralmente fica em **um destes locais**:

### 1️⃣ **Banco de Dados** (mais comum)
- Tabela: `users` ou `admins` ou `accounts`
- Campo: `password` (criptografado com bcrypt/hash)

### 2️⃣ **Arquivo .env** (menos seguro, mas possível)
- Arquivo: `api/.env` ou `.env`
- Variável: `ADMIN_PASSWORD=Admin#123456`

### 3️⃣ **Seed/Migration** (configuração inicial)
- Arquivo: `api/src/database/seeds/` ou similar
- Define senha inicial no primeiro deploy

---

## 🔍 DESCOBRIR ONDE ESTÁ

Execute estes comandos para localizar:

```bash
# Buscar em arquivos .env
grep -r "Admin#123456\|admin@admin.com" .env* */**.env 2>/dev/null

# Buscar no código
grep -r "Admin#123456\|admin@admin.com" api/ --include="*.js" --include="*.ts"

# Verificar no banco (MongoDB)
docker exec -it mongodb_container mongosh
> use autoflow
> db.users.find({ email: "admin@admin.com" })

# Verificar no banco (SQLite)
sqlite3 data/autoflow.db "SELECT * FROM users WHERE email='admin@admin.com';"
```

---

## ✅ MÉTODO 1: Trocar no Banco de Dados (RECOMENDADO)

### Se usar **MongoDB**:

```bash
# 1. Gerar hash da nova senha (use bcrypt)
# Você pode usar um site: https://bcrypt-generator.com/
# Ou instalar: npm install -g bcrypt-cli
# Exemplo: bcrypt-cli "MinhaS3nhaN0va@2024" 10

# 2. Conectar no MongoDB
docker exec -it mongodb_container mongosh

# 3. Atualizar senha
use autoflow
db.users.updateOne(
  { email: "admin@admin.com" },
  { $set: { password: "$2b$10$SEU_HASH_BCRYPT_AQUI" } }
)

# 4. Verificar
db.users.findOne({ email: "admin@admin.com" })

# 5. Sair
exit
```

### Se usar **SQLite**:

```bash
# 1. Gerar hash da nova senha
# Use: https://bcrypt-generator.com/
# Ou: node -e "console.log(require('bcrypt').hashSync('MinhaS3nhaN0va@2024', 10))"

# 2. Atualizar no banco
sqlite3 data/autoflow.db

# 3. Executar update
UPDATE users 
SET password = '$2b$10$SEU_HASH_BCRYPT_AQUI' 
WHERE email = 'admin@admin.com';

# 4. Verificar
SELECT email, password FROM users WHERE email='admin@admin.com';

# 5. Sair
.quit
```

---

## ✅ MÉTODO 2: Trocar via Código (Se tiver acesso)

### Criar script de atualização:

```javascript
// scripts/change-admin-password.js
const bcrypt = require('bcrypt');
const db = require('../api/src/config/database'); // Ajuste o caminho

async function changeAdminPassword(newPassword) {
  try {
    // Gerar hash
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar no banco (exemplo MongoDB)
    await db.collection('users').updateOne(
      { email: 'admin@admin.com' },
      { $set: { password: hashedPassword } }
    );
    
    console.log('✅ Senha do admin atualizada com sucesso!');
    console.log(`📧 Email: admin@admin.com`);
    console.log(`🔑 Nova senha: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar senha:', error);
  } finally {
    process.exit();
  }
}

// Executar
const novaSenha = process.argv[2] || 'MinhaS3nhaN0va@2024';
changeAdminPassword(novaSenha);
```

**Usar o script:**
```bash
# Instalar bcrypt se necessário
npm install bcrypt

# Executar script
node scripts/change-admin-password.js "MinhaS3nhaN0va@2024"
```

---

## ✅ MÉTODO 3: Trocar via Interface (Se houver)

Alguns sistemas têm tela de "Alterar Senha" ou "Configurações de Conta":

1. Faça login com credenciais atuais
2. Acesse: Menu → Configurações → Alterar Senha
3. Digite senha atual e nova senha
4. Salve

---

## 🔒 BOAS PRÁTICAS DE SENHA

### ✅ Senha Segura DEVE ter:
- Mínimo 12 caracteres
- Letras maiúsculas e minúsculas
- Números
- Caracteres especiais (@, #, $, %, etc)
- Não use palavras do dicionário
- Não use dados pessoais (nome, data de nascimento)

### ✅ Exemplos de Senhas Fortes:
```
T3mp0R@rY#2024!xW9
$3gurAnc4$ist3m@25
Au70Fl0w#S3nh@F0rt3!
```

### ❌ NUNCA use:
```
admin123
password
12345678
Admin#123456 (padrão atual)
```

---

## 🛡️ SEGURANÇA ADICIONAL

### 1️⃣ Mudar o Email Padrão Também

```sql
-- MongoDB
db.users.updateOne(
  { email: "admin@admin.com" },
  { $set: { 
    email: "seu-email@empresa.com",
    password: "$2b$10$SEU_HASH_AQUI"
  }}
)

-- SQLite
UPDATE users 
SET email = 'seu-email@empresa.com',
    password = '$2b$10$SEU_HASH_AQUI'
WHERE email = 'admin@admin.com';
```

### 2️⃣ Trocar JWT_SECRET

No arquivo `.env`:
```bash
# ANTES
JWT_SECRET=seu_secret_antigo

# DEPOIS (gere um aleatório)
JWT_SECRET=$(openssl rand -base64 32)
```

### 3️⃣ Implementar 2FA (Autenticação em 2 Fatores)

Se quiser mais segurança, posso criar um sistema de 2FA com:
- Google Authenticator
- SMS
- Email de verificação

---

## 🧪 TESTAR APÓS TROCAR

```bash
# 1. Limpar cookies/cache do navegador
# 2. Acessar: http://seu-servidor:porta
# 3. Tentar login com credenciais ANTIGAS (deve falhar)
# 4. Fazer login com credenciais NOVAS (deve funcionar)
```

---

## 📊 CHECKLIST

- [ ] Backup do banco antes de modificar
- [ ] Localizar onde senha está armazenada
- [ ] Gerar hash bcrypt da nova senha
- [ ] Atualizar no banco/código
- [ ] Testar login com nova senha
- [ ] Documentar nova senha em local seguro
- [ ] (Opcional) Mudar email padrão
- [ ] (Opcional) Trocar JWT_SECRET
- [ ] Limpar sessões antigas

---

## 🚨 RECUPERAÇÃO DE EMERGÊNCIA

Se esquecer a nova senha:

### Opção 1: Reset via Banco
```bash
# Voltar para senha padrão
# Hash de "Admin#123456"
$2b$10$YourHashHere

# MongoDB
db.users.updateOne(
  { email: "admin@admin.com" },
  { $set: { password: "$2b$10$YourHashHere" } }
)
```

### Opção 2: Restaurar Backup
```bash
# Se fez backup antes
cp backups/autoflow_backup.db data/autoflow.db
docker-compose restart
```

---

## 🔐 SCRIPT COMPLETO DE MUDANÇA

Vou criar um script que faz tudo automaticamente:

```bash
#!/bin/bash
# change-admin-password.sh

echo "🔐 Trocar Senha do Admin - WhatsApp AutoFlow"
echo ""

# Solicitar nova senha
read -sp "Digite a nova senha: " NEW_PASSWORD
echo ""
read -sp "Confirme a nova senha: " CONFIRM_PASSWORD
echo ""

if [ "$NEW_PASSWORD" != "$CONFIRM_PASSWORD" ]; then
  echo "❌ Senhas não conferem!"
  exit 1
fi

# Gerar hash (requer bcrypt instalado)
HASH=$(node -e "console.log(require('bcrypt').hashSync('$NEW_PASSWORD', 10))")

echo "✅ Hash gerado: $HASH"
echo ""

# Atualizar banco (ajuste conforme seu banco)
echo "Atualizando banco de dados..."

# Se SQLite:
sqlite3 data/autoflow.db "UPDATE users SET password='$HASH' WHERE email='admin@admin.com';"

# Se MongoDB:
# docker exec -it mongodb mongosh autoflow --eval "db.users.updateOne({email:'admin@admin.com'}, {\$set:{password:'$HASH'}})"

echo "✅ Senha atualizada com sucesso!"
echo ""
echo "📧 Email: admin@admin.com"
echo "🔑 Nova senha: [sua senha segura]"
```

---

## 📞 PRECISA DE AJUDA?

Se quiser que eu crie um script específico para o SEU sistema:

1. Me diga qual banco você usa (MongoDB, SQLite, PostgreSQL)
2. Me mostre a estrutura da tabela de usuários
3. Crio um script sob medida para você

---

**🔒 Lembre-se:** SEMPRE faça backup antes de modificar senhas!
