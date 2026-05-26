// api/src/utils/activityLogger.js
// Helper para registrar atividades no sistema

const logActivity = async (db, type, description, details = {}) => {
  try {
    const activity = {
      type,
      description,
      details,
      timestamp: new Date(),
      created_at: new Date()
    };
    
    // MONGODB
    await db.collection('activities').insertOne(activity);
    
    // SQLITE (comentado - descomente se usar)
    // await new Promise((resolve, reject) => {
    //   db.run(
    //     'INSERT INTO activities (type, description, details, timestamp) VALUES (?, ?, ?, ?)',
    //     [type, description, JSON.stringify(details), new Date().toISOString()],
    //     (err) => err ? reject(err) : resolve()
    //   );
    // });
    
    console.log(`✅ Atividade registrada: ${type} - ${description}`);
    
  } catch (error) {
    console.error('❌ Erro ao registrar atividade:', error);
    // Não interrompe o fluxo principal se falhar
  }
};

// Funções helper para tipos comuns de atividade
const activityLogger = {
  
  /**
   * Registrar resposta automática enviada
   */
  autoReplySent: async (db, ruleName, contact) => {
    await logActivity(
      db,
      'auto_reply',
      `Resposta automática: ${ruleName}`,
      { rule: ruleName, contact, type: 'sent' }
    );
  },
  
  /**
   * Registrar mensagem enviada
   */
  messageSent: async (db, to, message) => {
    await logActivity(
      db,
      'message_sent',
      `Mensagem enviada para ${to}`,
      { to, messagePreview: message.substring(0, 50) }
    );
  },
  
  /**
   * Registrar mensagem recebida
   */
  messageReceived: async (db, from, message) => {
    await logActivity(
      db,
      'message_received',
      `Mensagem de ${from}`,
      { from, messagePreview: message.substring(0, 50) }
    );
  },
  
  /**
   * Registrar criação de automação
   */
  automationCreated: async (db, name, type) => {
    await logActivity(
      db,
      'automation_created',
      `Automação criada: ${name}`,
      { name, type }
    );
  },
  
  /**
   * Registrar atualização de automação
   */
  automationUpdated: async (db, name) => {
    await logActivity(
      db,
      'automation_updated',
      `Automação atualizada: ${name}`,
      { name }
    );
  },
  
  /**
   * Registrar remoção de automação
   */
  automationDeleted: async (db, name) => {
    await logActivity(
      db,
      'automation_deleted',
      `Automação removida: ${name}`,
      { name }
    );
  },
  
  /**
   * Registrar contato adicionado
   */
  contactAdded: async (db, name, phone) => {
    await logActivity(
      db,
      'contact_added',
      `Contato adicionado: ${name}`,
      { name, phone }
    );
  },
  
  /**
   * Registrar conexão do WhatsApp
   */
  whatsappConnected: async (db) => {
    await logActivity(
      db,
      'whatsapp_connected',
      'WhatsApp conectado com sucesso'
    );
  },
  
  /**
   * Registrar desconexão do WhatsApp
   */
  whatsappDisconnected: async (db, reason) => {
    await logActivity(
      db,
      'whatsapp_disconnected',
      'WhatsApp desconectado',
      { reason }
    );
  },
  
  /**
   * Registrar erro
   */
  error: async (db, message, details) => {
    await logActivity(
      db,
      'error',
      message,
      details
    );
  },
  
  /**
   * Registrar sucesso genérico
   */
  success: async (db, message, details) => {
    await logActivity(
      db,
      'success',
      message,
      details
    );
  }
};

module.exports = activityLogger;
