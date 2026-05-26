// api/src/routes/settings.js
// Rotas para gerenciar configurações do sistema

const express = require('express');
const router = express.Router();
const SettingsModel = require('../models/Settings');

// Middleware de validação simples (ajuste conforme seu sistema de auth)
const requireAuth = (req, res, next) => {
  // TODO: Implementar autenticação real aqui
  // Por enquanto, apenas passa
  next();
};

/**
 * GET /api/settings
 * Retorna todas as configurações
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const settings = await SettingsModel.getAll();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar configurações'
    });
  }
});

/**
 * GET /api/settings/delay-config
 * Retorna configurações de delay formatadas
 */
router.get('/delay-config', requireAuth, async (req, res) => {
  try {
    const config = await SettingsModel.getDelayConfig();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Erro ao buscar configuração de delay:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar configuração de delay'
    });
  }
});

/**
 * GET /api/settings/:key
 * Retorna uma configuração específica
 */
router.get('/:key', requireAuth, async (req, res) => {
  try {
    const setting = await SettingsModel.getByKey(req.params.key);
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Configuração não encontrada'
      });
    }
    
    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar configuração'
    });
  }
});

/**
 * PUT /api/settings/:key
 * Atualiza uma configuração
 */
router.put('/:key', requireAuth, async (req, res) => {
  try {
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Valor não fornecido'
      });
    }
    
    const result = await SettingsModel.update(req.params.key, value);
    
    res.json({
      success: true,
      data: result,
      message: 'Configuração atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/settings
 * Atualiza múltiplas configurações (batch update)
 */
router.put('/', requireAuth, async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        error: 'Formato inválido. Esperado: { settings: [{key, value}] }'
      });
    }
    
    const results = await SettingsModel.updateMultiple(settings);
    
    res.json({
      success: true,
      data: results,
      message: 'Configurações atualizadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao atualizar configurações',
      details: error.errors
    });
  }
});

/**
 * POST /api/settings/test-delay
 * Testa a configuração de delay atual (retorna valores calculados)
 */
router.post('/test-delay', requireAuth, async (req, res) => {
  try {
    const config = await SettingsModel.getDelayConfig();
    
    // Simula 5 delays aleatórios
    const samples = [];
    for (let i = 0; i < 5; i++) {
      const randomJitter = Math.floor(Math.random() * config.jitterMs);
      const totalDelay = config.minDelayMs + randomJitter;
      samples.push({
        message: i + 1,
        delayMs: totalDelay,
        delaySec: (totalDelay / 1000).toFixed(2)
      });
    }
    
    res.json({
      success: true,
      data: {
        config,
        samples,
        explanation: `Cada mensagem terá um delay entre ${config.minTotal}ms (${(config.minTotal/1000).toFixed(1)}s) e ${config.maxTotal}ms (${(config.maxTotal/1000).toFixed(1)}s)`
      }
    });
  } catch (error) {
    console.error('Erro ao testar delay:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao testar configuração de delay'
    });
  }
});

module.exports = router;
