// web/src/components/RecentActivity.jsx
// Componente visual melhorado para Atividade Recente

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadActivities = async () => {
    try {
      const response = await axios.get('/api/activities/recent');
      
      if (response.data.success) {
        setActivities(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      'auto_reply': '🤖',
      'message_sent': '📤',
      'message_received': '📥',
      'contact_added': '👤',
      'automation_created': '✨',
      'automation_updated': '🔄',
      'automation_deleted': '🗑️',
      'whatsapp_connected': '✅',
      'whatsapp_disconnected': '❌',
      'error': '⚠️',
      'success': '✅'
    };
    
    return icons[type] || '📋';
  };

  const getActivityColor = (type) => {
    const colors = {
      'auto_reply': '#3b82f6',
      'message_sent': '#10b981',
      'message_received': '#8b5cf6',
      'contact_added': '#f59e0b',
      'automation_created': '#06b6d4',
      'automation_updated': '#6366f1',
      'automation_deleted': '#ef4444',
      'whatsapp_connected': '#10b981',
      'whatsapp_disconnected': '#ef4444',
      'error': '#ef4444',
      'success': '#10b981'
    };
    
    return colors[type] || '#6b7280';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Menos de 1 minuto
    if (diff < 60000) {
      return 'Agora mesmo';
    }
    
    // Menos de 1 hora
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} min atrás`;
    }
    
    // Menos de 24 horas
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h atrás`;
    }
    
    // Mais de 24 horas
    const options = { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return date.toLocaleString('pt-BR', options);
  };

  const getActivityTitle = (activity) => {
    const titles = {
      'auto_reply': 'Resposta Automática',
      'message_sent': 'Mensagem Enviada',
      'message_received': 'Mensagem Recebida',
      'contact_added': 'Contato Adicionado',
      'automation_created': 'Automação Criada',
      'automation_updated': 'Automação Atualizada',
      'automation_deleted': 'Automação Removida',
      'whatsapp_connected': 'WhatsApp Conectado',
      'whatsapp_disconnected': 'WhatsApp Desconectado',
      'error': 'Erro',
      'success': 'Sucesso'
    };
    
    return titles[activity.type] || activity.type;
  };

  if (loading) {
    return (
      <div className="recent-activity">
        <div className="activity-header">
          <h3>🕐 Atividade recente</h3>
          <button className="refresh-btn" disabled>
            🔄
          </button>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <span>Carregando atividades...</span>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="recent-activity">
        <div className="activity-header">
          <h3>🕐 Atividade recente</h3>
          <button className="refresh-btn" onClick={loadActivities}>
            🔄
          </button>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>Nenhuma atividade recente</p>
          <span className="empty-hint">
            As atividades aparecerão aqui quando houver interações
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-activity">
      <div className="activity-header">
        <h3>🕐 Atividade recente</h3>
        <button 
          className="refresh-btn" 
          onClick={loadActivities}
          title="Atualizar"
        >
          🔄
        </button>
      </div>

      <div className="activity-list">
        {activities.map((activity, index) => (
          <div 
            key={activity.id || index} 
            className="activity-item"
            style={{ '--activity-color': getActivityColor(activity.type) }}
          >
            <div className="activity-icon">
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="activity-content">
              <div className="activity-title">
                {getActivityTitle(activity)}
              </div>
              
              <div className="activity-description">
                {activity.description || activity.message || 'Sem descrição'}
              </div>
              
              {activity.details && (
                <div className="activity-details">
                  {typeof activity.details === 'string' 
                    ? activity.details 
                    : JSON.stringify(activity.details)
                  }
                </div>
              )}
            </div>
            
            <div className="activity-time">
              {formatTime(activity.timestamp || activity.created_at)}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .recent-activity {
          background: #1e293b;
          border-radius: 12px;
          padding: 20px;
          color: #e2e8f0;
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #334155;
        }

        .activity-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #f1f5f9;
        }

        .refresh-btn {
          background: transparent;
          border: 1px solid #475569;
          border-radius: 6px;
          padding: 6px 10px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .refresh-btn:hover:not(:disabled) {
          background: #334155;
          border-color: #64748b;
        }

        .refresh-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          color: #94a3b8;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #334155;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .empty-state p {
          color: #cbd5e1;
          margin: 0 0 8px 0;
          font-weight: 500;
        }

        .empty-hint {
          color: #64748b;
          font-size: 13px;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .activity-list::-webkit-scrollbar {
          width: 6px;
        }

        .activity-list::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 3px;
        }

        .activity-list::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 3px;
        }

        .activity-list::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }

        .activity-item {
          display: grid;
          grid-template-columns: 40px 1fr auto;
          gap: 12px;
          padding: 12px;
          background: #0f172a;
          border-radius: 8px;
          border-left: 3px solid var(--activity-color);
          transition: all 0.2s;
        }

        .activity-item:hover {
          background: #1e293b;
          transform: translateX(2px);
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--activity-color);
          border-radius: 8px;
          font-size: 20px;
          opacity: 0.9;
        }

        .activity-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .activity-title {
          font-weight: 600;
          font-size: 14px;
          color: #f1f5f9;
        }

        .activity-description {
          font-size: 13px;
          color: #cbd5e1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .activity-details {
          font-size: 12px;
          color: #94a3b8;
          font-family: monospace;
          background: #1e293b;
          padding: 4px 8px;
          border-radius: 4px;
          margin-top: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .activity-time {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
          align-self: flex-start;
          padding-top: 2px;
        }

        @media (max-width: 768px) {
          .activity-item {
            grid-template-columns: 32px 1fr;
            gap: 8px;
          }

          .activity-icon {
            width: 32px;
            height: 32px;
            font-size: 16px;
          }

          .activity-time {
            grid-column: 2;
            margin-top: -4px;
          }
        }
      `}</style>
    </div>
  );
};

export default RecentActivity;
