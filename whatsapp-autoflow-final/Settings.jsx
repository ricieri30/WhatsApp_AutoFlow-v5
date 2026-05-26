// web/src/pages/Settings.jsx
// Tela de configurações de anti-banimento

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingDelay, setTestingDelay] = useState(false);
  
  const [config, setConfig] = useState({
    min_message_delay_ms: 6000,
    jitter_ms: 3000,
    max_messages_per_day: 100,
    throttle_per_minute: 10,
    enable_anti_ban: true
  });

  const [testResults, setTestResults] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  // Carregar configurações ao montar
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/settings');
      
      if (response.data.success) {
        const settingsObj = {};
        response.data.data.forEach(setting => {
          settingsObj[setting.key] = setting.value;
        });
        setConfig(settingsObj);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      alert('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
    setSaveMessage(null); // Limpar mensagem ao editar
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);
      
      const updates = Object.keys(config).map(key => ({
        key,
        value: config[key]
      }));
      
      const response = await axios.put('/api/settings', {
        settings: updates
      });
      
      if (response.data.success) {
        setSaveMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        setTimeout(() => setSaveMessage(null), 5000);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSaveMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao salvar configurações'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestDelay = async () => {
    try {
      setTestingDelay(true);
      const response = await axios.post('/api/settings/test-delay');
      
      if (response.data.success) {
        setTestResults(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao testar:', error);
      alert('Erro ao testar configuração');
    } finally {
      setTestingDelay(false);
    }
  };

  const calculateTotalDelay = () => {
    const min = config.min_message_delay_ms / 1000;
    const max = (config.min_message_delay_ms + config.jitter_ms) / 1000;
    return { min: min.toFixed(1), max: max.toFixed(1) };
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading">Carregando configurações...</div>
      </div>
    );
  }

  const totalDelay = calculateTotalDelay();

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ Configurações de Segurança</h1>
        <p className="subtitle">Ajuste os parâmetros de anti-banimento do WhatsApp</p>
      </div>

      <div className="settings-card">
        <div className="card-section">
          <h2>🛡️ Anti-Banimento WhatsApp</h2>
          
          <div className="form-group">
            <label>
              Delay mínimo entre mensagens (segundos)
              <span className="helper">Recomendado: 6-15 segundos</span>
            </label>
            <input
              type="number"
              min="2"
              max="60"
              step="0.5"
              value={config.min_message_delay_ms / 1000}
              onChange={(e) => handleChange('min_message_delay_ms', e.target.value * 1000)}
              className="input-number"
            />
            <div className="range-bar">
              <span>2s</span>
              <input
                type="range"
                min="2"
                max="60"
                step="0.5"
                value={config.min_message_delay_ms / 1000}
                onChange={(e) => handleChange('min_message_delay_ms', e.target.value * 1000)}
              />
              <span>60s</span>
            </div>
          </div>

          <div className="form-group">
            <label>
              Variação aleatória - Jitter (segundos)
              <span className="helper">Adiciona aleatoriedade para parecer humano</span>
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={config.jitter_ms / 1000}
              onChange={(e) => handleChange('jitter_ms', e.target.value * 1000)}
              className="input-number"
            />
            <div className="range-bar">
              <span>0s</span>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={config.jitter_ms / 1000}
                onChange={(e) => handleChange('jitter_ms', e.target.value * 1000)}
              />
              <span>10s</span>
            </div>
          </div>

          <div className="delay-preview">
            <div className="preview-box">
              <strong>💬 Resumo:</strong>
              <p>
                Cada mensagem será enviada entre{' '}
                <span className="highlight">{totalDelay.min}s</span> e{' '}
                <span className="highlight">{totalDelay.max}s</span> (aleatório)
              </p>
            </div>
          </div>

          <div className="form-group">
            <label>
              Limite diário de mensagens
              <span className="helper">Máximo de mensagens por dia</span>
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              value={config.max_messages_per_day}
              onChange={(e) => handleChange('max_messages_per_day', parseInt(e.target.value))}
              className="input-number"
            />
          </div>

          <div className="form-group">
            <label>
              Limite por minuto
              <span className="helper">Máximo de mensagens por minuto</span>
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={config.throttle_per_minute}
              onChange={(e) => handleChange('throttle_per_minute', parseInt(e.target.value))}
              className="input-number"
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.enable_anti_ban}
                onChange={(e) => handleChange('enable_anti_ban', e.target.checked)}
              />
              Ativar proteção anti-banimento
            </label>
          </div>
        </div>

        {saveMessage && (
          <div className={`message ${saveMessage.type}`}>
            {saveMessage.text}
          </div>
        )}

        <div className="card-actions">
          <button
            onClick={handleTestDelay}
            disabled={testingDelay}
            className="btn btn-secondary"
          >
            {testingDelay ? '🔄 Testando...' : '🧪 Testar Configuração'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? '💾 Salvando...' : '💾 Salvar Configurações'}
          </button>
        </div>

        {testResults && (
          <div className="test-results">
            <h3>📊 Teste de Delay</h3>
            <p className="explanation">{testResults.explanation}</p>
            
            <table className="results-table">
              <thead>
                <tr>
                  <th>Mensagem</th>
                  <th>Delay (segundos)</th>
                </tr>
              </thead>
              <tbody>
                {testResults.samples.map((sample) => (
                  <tr key={sample.message}>
                    <td>Mensagem {sample.message}</td>
                    <td>{sample.delaySec}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .settings-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .settings-header {
          margin-bottom: 30px;
        }

        .settings-header h1 {
          font-size: 28px;
          margin-bottom: 8px;
          color: #333;
        }

        .subtitle {
          color: #666;
          font-size: 14px;
        }

        .settings-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 30px;
        }

        .card-section h2 {
          font-size: 20px;
          margin-bottom: 20px;
          color: #444;
        }

        .form-group {
          margin-bottom: 25px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
        }

        .helper {
          display: block;
          font-size: 12px;
          font-weight: normal;
          color: #888;
          margin-top: 4px;
        }

        .input-number {
          width: 120px;
          padding: 10px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 16px;
        }

        .range-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
        }

        .range-bar input[type="range"] {
          flex: 1;
        }

        .range-bar span {
          font-size: 12px;
          color: #888;
        }

        .delay-preview {
          background: #f0f9ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }

        .preview-box strong {
          display: block;
          margin-bottom: 8px;
          color: #1e40af;
        }

        .preview-box p {
          margin: 0;
          color: #1e3a8a;
        }

        .highlight {
          font-weight: bold;
          color: #1e40af;
        }

        .checkbox-group {
          padding: 15px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .message {
          padding: 12px 16px;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 500;
        }

        .message.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #059669;
        }

        .message.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #dc2626;
        }

        .card-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .test-results {
          margin-top: 30px;
          padding: 20px;
          background: #fef3c7;
          border-radius: 8px;
        }

        .test-results h3 {
          margin-top: 0;
          color: #92400e;
        }

        .explanation {
          color: #78350f;
          margin-bottom: 16px;
        }

        .results-table {
          width: 100%;
          border-collapse: collapse;
        }

        .results-table th,
        .results-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #fcd34d;
        }

        .results-table th {
          background: #fbbf24;
          color: #78350f;
          font-weight: 600;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default Settings;
