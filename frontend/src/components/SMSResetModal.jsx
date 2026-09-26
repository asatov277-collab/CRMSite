import React, { useState } from 'react';
import { X, Smartphone, KeyRound, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export default function SMSResetModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: enter phone, 2: enter code & new pass
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.forgotPassword(phone);
      setMessage(res.message);
      setDebugOtp(res.debug_otp);
      setStep(2);
    } catch (err) {
      setError(err.message || 'SMS kod yuborishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.verifyResetPassword({
        phone,
        otp_code: otpCode,
        new_password: newPassword
      });
      setMessage(res.message);
      setTimeout(() => {
        onClose();
        setStep(1);
        setPhone('');
        setOtpCode('');
        setNewPassword('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Parolni tiklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} color="var(--primary-color)" /> Parolni SMS Orqali Tiklash
          </h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {error && <div className="badge badge-danger" style={{ marginBottom: '14px', width: '100%', padding: '10px' }}>{error}</div>}
        {message && <div className="badge badge-success" style={{ marginBottom: '14px', width: '100%', padding: '10px' }}>{message}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestOTP}>
            <div className="form-group">
              <label className="form-label">Tizimda ro'yxatdan o'tgan Telefon raqamingiz:</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Bekor qilish</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Yuborilmoqda...' : 'SMS Kod Yuborish'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyReset}>
            {debugOtp && (
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid var(--warning)', padding: '10px', borderRadius: 'var(--radius-md)', marginBottom: '14px', fontSize: '0.85rem' }}>
                🔑 Simulation Test kodi: <strong style={{ color: 'var(--warning)', fontSize: '1rem' }}>{debugOtp}</strong>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">SMS Tasdiqlash kodi:</label>
              <input
                type="text"
                className="form-control"
                placeholder="6 xonali SMS kod"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Yangi Parol:</label>
              <input
                type="password"
                className="form-control"
                placeholder="Yangi parolingizni kiriting"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Orqaga</button>
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? 'O\'rnatilmoqda...' : 'Parolni Yangilash'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
