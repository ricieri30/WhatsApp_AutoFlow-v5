// worker/src/worker.js
// Worker modificado com delays configuráveis via banco de dados

const SettingsModel = require('../../api/src/models/Settings'); // Ajuste o caminho

class MessageWorker {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.stats = {
      sent: 0,
      failed: 0,
      queued: 0
    };
    
    // Cache de configurações (recarrega a cada 5 minutos)
    this.configCache = null;
    this.configCacheTime = 0;
    this.CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutos
    
    // Contador de mensagens por dia
    this.dailyCount = 0;
    this.lastResetDate = new Date().toDateString();
  }

  /**
   * Obter configurações de delay (com cache)
   */
  async getDelayConfig() {
    const now = Date.now();
    
    // Retornar cache se ainda válido
    if (this.configCache && (now - this.configCacheTime) < this.CONFIG_CACHE_TTL) {
      return this.configCache;
    }
    
    try {
      // Buscar do banco
      this.configCache = await SettingsModel.getDelayConfig();
      this.configCacheTime = now;
      
      console.log('🔄 Configurações de delay recarregadas:', {
        minDelay: `${this.configCache.minDelayMs}ms`,
        jitter: `${this.configCache.jitterMs}ms`,
        range: `${(this.configCache.minTotal/1000).toFixed(1)}-${(this.configCache.maxTotal/1000).toFixed(1)}s`,
        maxPerDay: this.configCache.maxPerDay
      });
      
      return this.configCache;
    } catch (error) {
      console.error('❌ Erro ao buscar configurações, usando padrão:', error);
      
      // Fallback para valores padrão se o banco falhar
      return {
        minDelayMs: 6000,
        jitterMs: 3000,
        maxPerDay: 100,
        throttlePerMinute: 10,
        enabled: true,
        minTotal: 6000,
        maxTotal: 9000
      };
    }
  }

  /**
   * Calcular delay com jitter aleatório
   */
  async calculateDelay() {
    const config = await this.getDelayConfig();
    
    if (!config.enabled) {
      console.log('⚠️ Anti-ban desabilitado, sem delay');
      return 0;
    }
    
    // Delay = mínimo + jitter aleatório
    const randomJitter = Math.floor(Math.random() * config.jitterMs);
    const totalDelay = config.minDelayMs + randomJitter;
    
    return totalDelay;
  }

  /**
   * Verificar limite diário de mensagens
   */
  async checkDailyLimit() {
    const config = await this.getDelayConfig();
    const today = new Date().toDateString();
    
    // Reset contador se mudou de dia
    if (today !== this.lastResetDate) {
      console.log('📅 Novo dia detectado, resetando contador');
      this.dailyCount = 0;
      this.lastResetDate = today;
    }
    
    if (this.dailyCount >= config.maxPerDay) {
      console.log(`🚫 Limite diário atingido (${config.maxPerDay} mensagens)`);
      return false;
    }
    
    return true;
  }

  /**
   * Adicionar mensagem na fila
   */
  async addToQueue(message) {
    this.queue.push({
      ...message,
      addedAt: Date.now()
    });
    
    this.stats.queued = this.queue.length;
    console.log(`📥 Mensagem adicionada à fila. Total: ${this.queue.length}`);
    
    // Inicia processamento se não estiver rodando
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Processar fila de mensagens
   */
  async processQueue() {
    if (this.processing) {
      console.log('⚠️ Worker já está processando');
      return;
    }
    
    this.processing = true;
    console.log('🔄 Iniciando processamento da fila...');
    
    while (this.queue.length > 0) {
      // Verificar limite diário
      const canSend = await this.checkDailyLimit();
      if (!canSend) {
        console.log('⏸️ Processamento pausado - limite diário atingido');
        break;
      }
      
      const message = this.queue.shift();
      this.stats.queued = this.queue.length;
      
      console.log(`\n📤 Processando mensagem ${this.stats.sent + 1}`);
      console.log(`   Para: ${message.to}`);
      console.log(`   Fila restante: ${this.queue.length}`);
      
      try {
        // Enviar mensagem (substitua pela sua lógica de envio real)
        await this.sendMessage(message);
        
        this.stats.sent++;
        this.dailyCount++;
        
        console.log(`✅ Mensagem enviada com sucesso (${this.stats.sent} hoje)`);
        
        // Aplicar delay anti-banimento (exceto na última mensagem)
        if (this.queue.length > 0) {
          const delay = await this.calculateDelay();
          const delaySec = (delay / 1000).toFixed(2);
          
          console.log(`⏳ Aguardando ${delaySec}s (anti-ban)...`);
          await this.sleep(delay);
        }
        
      } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        this.stats.failed++;
        
        // Aqui você pode implementar lógica de retry
        // Por exemplo: colocar de volta na fila com contador de tentativas
      }
    }
    
    this.processing = false;
    console.log('\n✅ Fila processada!');
    console.log(`📊 Estatísticas: ${this.stats.sent} enviadas, ${this.stats.failed} falhas`);
  }

  /**
   * Enviar mensagem (implementar com sua lógica real)
   */
  async sendMessage(message) {
    // SUBSTITUA ISSO pela sua lógica real de envio
    // Exemplo:
    // return await whatsappClient.sendText(message.to, message.text);
    
    // Simulação (remover em produção):
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`   [MOCK] Mensagem enviada para ${message.to}`);
        resolve();
      }, 500);
    });
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    return {
      ...this.stats,
      dailyCount: this.dailyCount,
      processing: this.processing
    };
  }

  /**
   * Forçar recarga de configurações
   */
  async reloadConfig() {
    this.configCache = null;
    this.configCacheTime = 0;
    return await this.getDelayConfig();
  }
}

// Exportar instância única (singleton)
const worker = new MessageWorker();
module.exports = worker;
