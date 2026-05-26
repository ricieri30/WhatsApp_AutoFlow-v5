// api/src/models/Settings.js
// Model para gerenciar configurações do sistema

const db = require('../config/database'); // Ajuste conforme seu caminho

class SettingsModel {
  
  /**
   * Buscar todas as configurações
   */
  static async getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM settings ORDER BY key', [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Converter valores para tipos corretos
          const settings = rows.map(row => ({
            ...row,
            value: this.parseValue(row.value, row.type)
          }));
          resolve(settings);
        }
      });
    });
  }

  /**
   * Buscar configuração por chave
   */
  static async getByKey(key) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM settings WHERE key = ?', [key], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            ...row,
            value: this.parseValue(row.value, row.type)
          });
        }
      });
    });
  }

  /**
   * Buscar múltiplas configurações por chaves
   */
  static async getByKeys(keys) {
    const placeholders = keys.map(() => '?').join(',');
    const sql = `SELECT * FROM settings WHERE key IN (${placeholders})`;
    
    return new Promise((resolve, reject) => {
      db.all(sql, keys, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const settings = {};
          rows.forEach(row => {
            settings[row.key] = this.parseValue(row.value, row.type);
          });
          resolve(settings);
        }
      });
    });
  }

  /**
   * Atualizar configuração
   */
  static async update(key, value) {
    // Buscar configuração para validar
    const setting = await this.getByKey(key);
    
    if (!setting) {
      throw new Error(`Configuração ${key} não encontrada`);
    }

    // Validar valor
    const validatedValue = this.validateValue(value, setting);
    
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE settings 
        SET value = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE key = ?
      `;
      
      db.run(sql, [String(validatedValue), key], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ key, value: validatedValue, updated: this.changes > 0 });
        }
      });
    });
  }

  /**
   * Atualizar múltiplas configurações (transação)
   */
  static async updateMultiple(updates) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        let completed = 0;
        const results = [];
        const errors = [];

        updates.forEach(async ({ key, value }) => {
          try {
            const result = await this.update(key, value);
            results.push(result);
          } catch (err) {
            errors.push({ key, error: err.message });
          } finally {
            completed++;
            
            if (completed === updates.length) {
              if (errors.length > 0) {
                db.run('ROLLBACK', () => {
                  reject({ 
                    message: 'Falha ao atualizar configurações', 
                    errors 
                  });
                });
              } else {
                db.run('COMMIT', () => {
                  resolve(results);
                });
              }
            }
          }
        });
      });
    });
  }

  /**
   * Validar valor de acordo com tipo e limites
   */
  static validateValue(value, setting) {
    const { type, min_value, max_value, key } = setting;

    switch (type) {
      case 'number':
        const num = Number(value);
        
        if (isNaN(num)) {
          throw new Error(`${key}: valor deve ser numérico`);
        }
        
        if (min_value !== null && num < min_value) {
          throw new Error(`${key}: valor mínimo é ${min_value}`);
        }
        
        if (max_value !== null && num > max_value) {
          throw new Error(`${key}: valor máximo é ${max_value}`);
        }
        
        return num;

      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (value === 'true' || value === '1') return true;
        if (value === 'false' || value === '0') return false;
        throw new Error(`${key}: valor deve ser true ou false`);

      case 'string':
        return String(value);

      default:
        return value;
    }
  }

  /**
   * Converter valor string do banco para tipo correto
   */
  static parseValue(value, type) {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true' || value === '1';
      default:
        return value;
    }
  }

  /**
   * Obter configurações de delay formatadas
   */
  static async getDelayConfig() {
    const keys = [
      'min_message_delay_ms',
      'jitter_ms',
      'max_messages_per_day',
      'throttle_per_minute',
      'enable_anti_ban'
    ];

    const settings = await this.getByKeys(keys);
    
    return {
      minDelayMs: settings.min_message_delay_ms || 6000,
      jitterMs: settings.jitter_ms || 3000,
      maxPerDay: settings.max_messages_per_day || 100,
      throttlePerMinute: settings.throttle_per_minute || 10,
      enabled: settings.enable_anti_ban !== false,
      // Cálculo do range total
      minTotal: settings.min_message_delay_ms || 6000,
      maxTotal: (settings.min_message_delay_ms || 6000) + (settings.jitter_ms || 3000)
    };
  }
}

module.exports = SettingsModel;
