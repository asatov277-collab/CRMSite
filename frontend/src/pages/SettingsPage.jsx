import React, { useState, useEffect } from 'react';
import { Settings, Save, Palette, Image, Globe, Phone, MapPin, DollarSign, KeyRound, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPage({ settings, onUpdateSettings }) {
  const [name, setName] = useState(settings?.name || 'WESTMINSTER CRM Educational Center');
  const [loginCode, setLoginCode] = useState(settings?.login_code || 'westminster.uz');
  const [phone, setPhone] = useState(settings?.phone || '+998 71 200 00 00');
  const [address, setAddress] = useState(settings?.address || 'Toshkent sh.');
  const [currency, setCurrency] = useState(settings?.currency || 'so\'m');
  const [timezone, setTimezone] = useState(settings?.timezone || 'Asia/Tashkent');
  const [themeColor, setThemeColor] = useState(settings?.theme_color || '#4F46E5');
  const [logoFile, setLogoFile] = useState(null);

  // Admin Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMessage, setPassMessage] = useState('');
  const [passError, setPassError] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('login_code', loginCode);
      formData.append('phone', phone);
      formData.append('address', address);
      formData.append('currency', currency);
      formData.append('timezone', timezone);
      formData.append('theme_color', themeColor);
      if (logoFile) {
        formData.append('logo_file', logoFile);
      }

      await api.updateSettings(formData);
      document.documentElement.style.setProperty('--primary-color', themeColor);

      const newSettings = await api.getSettings();
      onUpdateSettings(newSettings);
      setMessage("✅ Tizim sozlamalari muvaffaqiyatli saqlandi!");
    } catch (err) {
      setError(err.message || 'Sozlamalarni saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMessage('');
    setPassError('');

    if (newPassword !== confirmPassword) {
      setPassError("Yangi parollar mos kelmadi!");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await api.changePassword({
        user_id: user.id || 'admin1',
        current_password: currentPassword,
        new_password: newPassword
      });
      setPassMessage("✅ Admin paroli muvaffaqiyatli o'zgartirildi!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassError(err.message || 'Parolni o\'zgartirishda xatolik');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '850px' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>⚙️ Tizim Sozlamalari (Settings)</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          O'quv markaz brending, login kodi, parollar va konfiguratsiyalarini boshqarish
        </p>
      </div>

      {message && <div className="badge badge-success" style={{ width: '100%', padding: '12px' }}>{message}</div>}
      {error && <div className="badge badge-danger" style={{ width: '100%', padding: '12px' }}>{error}</div>}

      {/* Main Settings Card */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>
          🏢 O'quv Markaz Ma'lumotlari va Subdomen
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            {/* Center Name */}
            <div className="form-group">
              <label className="form-label">O'quv Markaz Nomi:</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            {/* Subdomain Login Code */}
            <div className="form-group">
              <label className="form-label">Subdomen / Kirish Kodi (Login Code):</label>
              <input
                type="text"
                className="form-control"
                value={loginCode}
                onChange={e => setLoginCode(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            {/* Phone */}
            <div className="form-group">
              <label className="form-label">Rasmiy Telefon Raqami:</label>
              <input
                type="text"
                className="form-control"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>

            {/* Address */}
            <div className="form-group">
              <label className="form-label">Manzil (Address):</label>
              <input
                type="text"
                className="form-control"
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            {/* Currency */}
            <div className="form-group">
              <label className="form-label">Valyuta:</label>
              <input
                type="text"
                className="form-control"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                required
              />
            </div>

            {/* Timezone */}
            <div className="form-group">
              <label className="form-label">Vaqt Zonasi (Timezone):</label>
              <input
                type="text"
                className="form-control"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Primary Theme Color & Logo */}
          <div className="grid-2" style={{ marginTop: '12px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Palette size={16} /> Sayt Asosiy Rangi (Theme Primary Color):
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  style={{ width: '50px', height: '42px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                  value={themeColor}
                  onChange={e => setThemeColor(e.target.value)}
                />
                <input
                  type="text"
                  className="form-control"
                  value={themeColor}
                  onChange={e => setThemeColor(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Image size={16} /> CRM Logo Rasm Fayli (Yuklash):
              </label>
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={e => setLogoFile(e.target.files[0])}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={18} /> {saving ? 'Saqlanmoqda...' : 'Sozlamalarni Saqlash'}
            </button>
          </div>
        </form>
      </div>

      {/* Admin Password Change Security Card */}
      <div className="card" style={{ border: '1px solid var(--warning-bg)' }}>
        <h3 className="card-title" style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <KeyRound size={20} /> Admin Parolini O'zgartirish (Xavfsizlik)
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Tizim admini hisobi parolini o'zgartirish uchun joriy parolni va yangi parolni kiriting.
        </p>

        {passMessage && <div className="badge badge-success" style={{ width: '100%', padding: '10px', marginBottom: '14px' }}>{passMessage}</div>}
        {passError && <div className="badge badge-danger" style={{ width: '100%', padding: '10px', marginBottom: '14px' }}>{passError}</div>}

        <form onSubmit={handleChangePassword}>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Joriy Parol (Current Password):</label>
              <input
                type="password"
                className="form-control"
                placeholder="Eski parolni kiriting"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Yangi Parol:</label>
              <input
                type="password"
                className="form-control"
                placeholder="Yangi parol"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Yangi Parolni Tasdiqlang:</label>
              <input
                type="password"
                className="form-control"
                placeholder="Takrorlang"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
            <button type="submit" className="btn btn-warning">
              <ShieldCheck size={18} /> Parolni Yangilash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
