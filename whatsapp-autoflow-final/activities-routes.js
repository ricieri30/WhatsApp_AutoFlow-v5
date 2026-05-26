// api/src/routes/activities.js
// API para gerenciar atividades recentes do sistema

const express = require('express');
const router = express.Router();

// Middleware de autenticação (ajuste conforme seu sistema)
const requireAuth = (req, res, next) => {
  // TODO: Implementar autenticação
  next();
};

/**
 * GET /api/activities/recent
 * Retorna as atividades recentes (últimas 20)
 */
router.get('/recent', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const db = req.app.locals.db;
    
    // MONGODB
    const activities = await db
      .collection('activities')
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    // SQLITE (comentado - use se for o seu caso)
    // const activities = await new Promise((resolve, reject) => {
    //   db.all(
    //     'SELECT * FROM activities ORDER BY timestamp DESC LIMIT ?',
    //     [limit],
    //     (err, rows) => err ? reject(err) : resolve(rows)
    //   );
    // });
    
    res.json({
      success: true,
      data: activities
    });
    
  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar atividades'
    });
  }
});

/**
 * POST /api/activities/log
 * Registra uma nova atividade
 */
router.post('/log', async (req, res) => {
  try {
    const { type, description, details } = req.body;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de atividade é obrigatório'
      });
    }
    
    const activity = {
      type,
      description: description || '',
      details: details || {},
      timestamp: new Date(),
      created_at: new Date()
    };
    
    const db = req.app.locals.db;
    
    // MONGODB
    const result = await db.collection('activities').insertOne(activity);
    activity._id = result.insertedId;
    
    // SQLITE (comentado)
    // await new Promise((resolve, reject) => {
    //   db.run(
    //     'INSERT INTO activities (type, description, details, timestamp) VALUES (?, ?, ?, ?)',
    //     [type, description, JSON.stringify(details), new Date().toISOString()],
    //     (err) => err ? reject(err) : resolve()
    //   );
    // });
    
    res.json({
      success: true,
      data: activity
    });
    
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao registrar atividade'
    });
  }
});

/**
 * DELETE /api/activities/clear
 * Limpa atividades antigas (mais de 30 dias)
 */
router.delete('/clear', requireAuth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const db = req.app.locals.db;
    
    // MONGODB
    const result = await db.collection('activities').deleteMany({
      timestamp: { $lt: thirtyDaysAgo }
    });
    
    // SQLITE (comentado)
    // await new Promise((resolve, reject) => {
    //   db.run(
    //     'DELETE FROM activities WHERE timestamp < ?',
    //     [thirtyDaysAgo.toISOString()],
    //     (err) => err ? reject(err) : resolve()
    //   );
    // });
    
    res.json({
      success: true,
      message: `${result.deletedCount} atividades antigas removidas`
    });
    
  } catch (error) {
    console.error('Erro ao limpar atividades:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao limpar atividades'
    });
  }
});

module.exports = router;
