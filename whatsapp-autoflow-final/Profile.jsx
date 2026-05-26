// web/src/pages/Profile.jsx
// Tela de Perfil e Configurações do Usuário

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [user, setUser] = useState({
    email: '',
    name: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [message, setMessage] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Carregar dados do usuário
  useEffect(() => {
    loadUserData();
  }, []);

  // Verificar força da senha em tempo real
  useEffect(() => {
    if (passwordForm.newPassword) {
      setPasswordStrength(calculatePasswordStrength(passwordForm.newPassword));
    } else {
      setPasswordStrength(0);
    }
  }, [passwordForm.newPassword]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/auth/me');
      
      if (response.data.success) {
        setUser({
          email: response.data.data.email || '',
          name: response.data.data.name || 'Administrador'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar dados do usuário' });
    } finally {
      setLoading(false);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    
    return Math.min(strength, 100);
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 40) return { label: 'Fraca', color: '#ef4444' };
    if (passwordStrength < 70) return { label: 'Média', color: '#f59e0b' };
    return { label: 'Forte', color: '#10b981' };
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
    setMessage(null);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!passwordForm.currentPassword) {
      setMessage({ type: 'error', text: 'Digite sua senha atual' });
      return;
    }
    
    if (!passwordForm.newPassword) {
      setMessage({ type: 'error', text: 'Digite a nova senha' });
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 8 caracteres' });
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não conferem' });
      return;
    }
    
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setMessage({ type: 'error', text: 'A nova senha deve ser diferente da atual' });
      return;
    }
    
    try {
      setSaving(true);
      const response = await axios.post('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
        
        // Limpar formulário
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Auto-hide mensagem após 5 segundos
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      
      const errorMsg = error.response?.data?.error || 'Erro ao alterar senha';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    
    if (!user.email) {
      setMessage({ type: 'error', text: 'Digite um email válido' });
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(user.email)) {
      setMessage({ type: 'error', text: 'Email inválido' });
      return;
    }
    
    try {
      setSaving(true);
      const response = await axios.put('/api/auth/update-email', {
        email: user.email
      });
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Email atualizado com sucesso!' });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      console.error('Erro ao atualizar email:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erro ao atualizar email' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  const strengthInfo = getPasswordStrengthLabel();

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>⚙️ Configurações do Perfil</h1>
        <p className="subtitle">Gerencie sua conta e preferências</p>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="profile-grid">
        {/* Informações da Conta */}
        <div className="profile-card">
          <h2>👤 Informações da Conta</h2>
          
          <form onSubmit={handleChangeEmail}>
            <div className="form-group">
              <label>Nome</label>
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                className="input-text"
                placeholder="Seu nome"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                className="input-text"
                placeholder="seu@email.com"
              />
              <span className="helper">Usado para login e notificações</span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-secondary"
            >
              {saving ? '💾 Salvando...' : '💾 Salvar Informações'}
            </button>
          </form>
        </div>

        {/* Alterar Senha */}
        <div className="profile-card">
          <h2>🔐 Alterar Senha</h2>
          
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Senha Atual</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                className="input-text"
                placeholder="Digite sua senha atual"
              />
            </div>

            <div className="form-group">
              <label>Nova Senha</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className="input-text"
                placeholder="Digite a nova senha (mín. 8 caracteres)"
              />
              
              {passwordForm.newPassword && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{ 
                        width: `${passwordStrength}%`,
                        backgroundColor: strengthInfo.color 
                      }}
                    />
                  </div>
                  <span 
                    className="strength-label"
                    style={{ color: strengthInfo.color }}
                  >
                    Força: {strengthInfo.label} ({passwordStrength}%)
                  </span>
                </div>
              )}
              
              <div className="password-tips">
                <small>💡 Dicas para senha forte:</small>
                <ul>
                  <li className={passwordForm.newPassword.length >= 12 ? 'valid' : ''}>
                    Mínimo 12 caracteres
                  </li>
                  <li className={/[a-z]/.test(passwordForm.newPassword) && /[A-Z]/.test(passwordForm.newPassword) ? 'valid' : ''}>
                    Letras maiúsculas e minúsculas
                  </li>
                  <li className={/[0-9]/.test(passwordForm.newPassword) ? 'valid' : ''}>
                    Números
                  </li>
                  <li className={/[^a-zA-Z0-9]/.test(passwordForm.newPassword) ? 'valid' : ''}>
                    Caracteres especiais (@, #, $, etc)
                  </li>
                </ul>
              </div>
            </div>

            <div className="form-group">
              <label>Confirmar Nova Senha</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                className="input-text"
                placeholder="Digite a nova senha novamente"
              />
              
              {passwordForm.confirmPassword && (
                <span className={`helper ${passwordForm.newPassword === passwordForm.confirmPassword ? 'success' : 'error'}`}>
                  {passwordForm.newPassword === passwordForm.confirmPassword ? '✅ Senhas conferem' : '❌ Senhas não conferem'}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={saving || passwordStrength < 40}
              className="btn btn-primary"
            >
              {saving ? '🔄 Alterando...' : '🔐 Alterar Senha'}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .profile-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .profile-header {
          margin-bottom: 30px;
        }

        .profile-header h1 {
          font-size: 28px;
          margin-bottom: 8px;
          color: #333;
        }

        .subtitle {
          color: #666;
          font-size: 14px;
        }

        .message {
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
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

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 20px;
        }

        .profile-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 30px;
        }

        .profile-card h2 {
          font-size: 20px;
          margin-bottom: 20px;
          color: #444;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
        }

        .input-text {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .input-text:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .helper {
          display: block;
          font-size: 12px;
          color: #888;
          margin-top: 4px;
        }

        .helper.success {
          color: #059669;
        }

        .helper.error {
          color: #dc2626;
        }

        .password-strength {
          margin-top: 8px;
        }

        .strength-bar {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .strength-fill {
          height: 100%;
          transition: width 0.3s, background-color 0.3s;
        }

        .strength-label {
          font-size: 12px;
          font-weight: 600;
        }

        .password-tips {
          margin-top: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .password-tips small {
          font-weight: 600;
          color: #374151;
        }

        .password-tips ul {
          margin: 8px 0 0 0;
          padding-left: 20px;
          list-style: none;
        }

        .password-tips li {
          font-size: 13px;
          color: #6b7280;
          margin: 4px 0;
          position: relative;
        }

        .password-tips li::before {
          content: '○';
          position: absolute;
          left: -15px;
        }

        .password-tips li.valid {
          color: #059669;
          font-weight: 500;
        }

        .password-tips li.valid::before {
          content: '✓';
          color: #059669;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
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

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
