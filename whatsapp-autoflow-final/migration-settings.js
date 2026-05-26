// scripts/migration-settings.js
// Migration para criar tabela de configurações

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ajuste o caminho do banco conforme sua estrutura
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/autoflow.db');

async function runMigration() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Erro ao conectar no banco:', err);
        reject(err);
        return;
      }
      console.log('✅ Conectado ao banco de dados');
    });

    // Criar tabela de configurações
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        type TEXT DEFAULT 'number',
        min_value INTEGER,
        max_value INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    db.run(createTableSQL, (err) => {
      if (err) {
        console.error('❌ Erro ao criar tabela settings:', err);
        reject(err);
        return;
      }
      console.log('✅ Tabela settings criada/verificada');

      // Inserir configurações padrão
      const defaultSettings = [
        {
          key: 'min_message_delay_ms',
          value: '6000',
          description: 'Delay mínimo entre mensagens (ms)',
          type: 'number',
          min_value: 2000,
          max_value: 60000
        },
        {
          key: 'jitter_ms',
          value: '3000',
          description: 'Variação aleatória de delay (ms)',
          type: 'number',
          min_value: 0,
          max_value: 10000
        },
        {
          key: 'max_messages_per_day',
          value: '100',
          description: 'Limite diário de mensagens',
          type: 'number',
          min_value: 10,
          max_value: 1000
        },
        {
          key: 'throttle_per_minute',
          value: '10',
          description: 'Máximo de mensagens por minuto',
          type: 'number',
          min_value: 1,
          max_value: 30
        },
        {
          key: 'enable_anti_ban',
          value: 'true',
          description: 'Ativar proteção anti-banimento',
          type: 'boolean',
          min_value: null,
          max_value: null
        }
      ];

      const insertSQL = `
        INSERT OR IGNORE INTO settings 
        (key, value, description, type, min_value, max_value)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      let completed = 0;
      const total = defaultSettings.length;

      defaultSettings.forEach((setting) => {
        db.run(
          insertSQL,
          [
            setting.key,
            setting.value,
            setting.description,
            setting.type,
            setting.min_value,
            setting.max_value
          ],
          (err) => {
            completed++;

            if (err) {
              console.error(`❌ Erro ao inserir ${setting.key}:`, err);
            } else {
              console.log(`✅ Configuração ${setting.key} inserida/verificada`);
            }

            if (completed === total) {
              console.log('\n🎉 Migration concluída com sucesso!');
              console.log('📊 Configurações padrão instaladas:\n');
              
              // Listar configurações criadas
              db.all('SELECT * FROM settings', [], (err, rows) => {
                if (!err) {
                  console.table(rows);
                }
                
                db.close((err) => {
                  if (err) {
                    reject(err);
                  } else {
                    console.log('\n✅ Conexão com banco fechada');
                    resolve();
                  }
                });
              });
            }
          }
        );
      });
    });
  });
}

// Executar migration
if (require.main === module) {
  console.log('🚀 Iniciando migration de configurações...\n');
  
  runMigration()
    .then(() => {
      console.log('\n✅ Tudo pronto! Configurações instaladas.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ Falha na migration:', err);
      process.exit(1);
    });
}

module.exports = { runMigration };
