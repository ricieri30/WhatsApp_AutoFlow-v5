// api/src/routes/auth.js
// Rotas de autenticação - alterar senha, email, etc

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Middleware de autenticação (ajuste conforme seu sistema)
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token não fornecido' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu-secret-aqui');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Token inválido' 
    });
  }
};

/**
 * GET /api/auth/me
 * Retorna dados do usuário logado
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    // AJUSTE ISSO conforme seu banco de dados
    // Exemplo MongoDB:
    const db = req.app.locals.db;
    const user = await db.collection('users').findOne(
      { _id: req.user.userId },
      { projection: { password: 0 } } // Não retornar senha
    );
    
    // Exemplo SQLite:
    // const db = req.app.locals.db;
    // db.get('SELECT id, email, name FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    //   if (err) return res.status(500).json({ success: false, error: 'Erro ao buscar usuário' });
    //   res.json({ success: true, data: user });
    // });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name || 'Administrador'
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar dados do usuário'
    });
  }
});

/**
 * POST /api/auth/change-password
 * Alterar senha do usuário
 */
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validações
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Senha atual e nova senha são obrigatórias'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'A nova senha deve ter no mínimo 8 caracteres'
      });
    }
    
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'A nova senha deve ser diferente da atual'
      });
    }
    
    // Buscar usuário
    const db = req.app.locals.db;
    
    // MongoDB:
    const user = await db.collection('users').findOne({ _id: req.user.userId });
    
    // SQLite (comentado - use se for o seu caso):
    // const user = await new Promise((resolve, reject) => {
    //   db.get('SELECT * FROM users WHERE id = ?', [req.user.userId], (err, row) => {
    //     if (err) reject(err);
    //     else resolve(row);
    //   });
    // });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }
    
    // Verificar senha atual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Senha atual incorreta'
      });
    }
    
    // Gerar hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar no banco
    // MongoDB:
    await db.collection('users').updateOne(
      { _id: req.user.userId },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );
    
    // SQLite (comentado):
    // await new Promise((resolve, reject) => {
    //   db.run(
    //     'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    //     [hashedPassword, req.user.userId],
    //     (err) => err ? reject(err) : resolve()
    //   );
    // });
    
    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao alterar senha'
    });
  }
});

/**
 * PUT /api/auth/update-email
 * Atualizar email do usuário
 */
router.put('/update-email', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validações
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }
    
    // Validar formato de email
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido'
      });
    }
    
    const db = req.app.locals.db;
    
    // Verificar se email já existe (outro usuário)
    // MongoDB:
    const existingUser = await db.collection('users').findOne({ 
      email: email,
      _id: { $ne: req.user.userId }
    });
    
    // SQLite (comentado):
    // const existingUser = await new Promise((resolve, reject) => {
    //   db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.userId], (err, row) => {
    //     if (err) reject(err);
    //     else resolve(row);
    //   });
    // });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Este email já está em uso'
      });
    }
    
    // Atualizar email
    // MongoDB:
    await db.collection('users').updateOne(
      { _id: req.user.userId },
      { $set: { email: email, updatedAt: new Date() } }
    );
    
    // SQLite (comentado):
    // await new Promise((resolve, reject) => {
    //   db.run(
    //     'UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    //     [email, req.user.userId],
    //     (err) => err ? reject(err) : resolve()
    //   );
    // });
    
    res.json({
      success: true,
      message: 'Email atualizado com sucesso',
      data: { email }
    });
    
  } catch (error) {
    console.error('Erro ao atualizar email:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar email'
    });
  }
});

/**
 * PUT /api/auth/update-name
 * Atualizar nome do usuário
 */
router.put('/update-name', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nome é obrigatório'
      });
    }
    
    const db = req.app.locals.db;
    
    // MongoDB:
    await db.collection('users').updateOne(
      { _id: req.user.userId },
      { $set: { name: name.trim(), updatedAt: new Date() } }
    );
    
    res.json({
      success: true,
      message: 'Nome atualizado com sucesso',
      data: { name: name.trim() }
    });
    
  } catch (error) {
    console.error('Erro ao atualizar nome:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar nome'
    });
  }
});

module.exports = router;
