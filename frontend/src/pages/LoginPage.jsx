import React, { useState, useEffect } from 'react';
import { LogIn, KeyRound, ShieldCheck, Phone, Lock, Globe } from 'lucide-react';
import { api } from '../services/api';
import SMSResetModal from '../components/SMSResetModal';

export default function LoginPage({ onLoginSuccess, settings }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState(settings?.login_code || 'westminster.uz');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);

  useEffect(() => {
    if (settings?.login_code) {
      setCode(settings.login_code);
    }
  }, [settings?.login_code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login({ phone, password, code });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Tizimga kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      background: 'radial-gradient(circle at 50% 30%, rgba(79, 70, 229, 0.15) 0%, #0B0F17 70%)',
      padding: '20px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, var(--primary-color), #818CF8)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            margin: '0 auto 16px auto',
            fontSize: '1.4rem',
            fontWeight: 800,
            boxShadow: '0 10px 25px var(--primary-glow)'
          }}>
            WST
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{settings?.name || 'WESTMINSTER CRM'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            O'quv markazi boshqaruv tizimiga kirish
          </p>
        </div>

        {error && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '10px', marginBottom: '16px', textTransform: 'none' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Subdomain / Center Code */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={14} /> O'quv Markaz Kodi (Subdomain):
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="masalan: westminster.uz"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
            />
          </div>

          {/* Phone or Login */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={14} /> Login yoki Telefon Raqam:
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Admin: Westminster_lc | O'qituvchi: +998 90..."
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} /> Parol:
              </label>
              <button
                type="button"
                onClick={() => setShowSMSModal(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Parolni unutdingizmi?
              </button>
            </div>
            <input
              type="password"
              className="form-control"
              placeholder="Parolingizni kiriting"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }} disabled={loading}>
            <LogIn size={18} /> {loading ? 'Tizimga kirilmoqda...' : 'Tizimga Kirish'}
          </button>
        </form>
      </div>

      <SMSResetModal isOpen={showSMSModal} onClose={() => setShowSMSModal(false)} />
    </div>
  );
}
