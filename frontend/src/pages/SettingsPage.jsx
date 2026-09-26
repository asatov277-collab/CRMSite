import React, { useState, useEffect } from 'react';
import { Settings, Save, Palette, Image, Globe, Phone, MapPin, DollarSign, KeyRound, ShieldCheck, Upload, Check } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPage({ settings, onUpdateSettings }) {
  const [name, setName] = useState(settings?.name || 'WESTMINSTER CRM Educational Center');
  const [loginCode, setLoginCode] = useState(settings?.login_code || 'westminster.uz');
  const [phone, setPhone] = useState(settings?.phone || '+998 71 200 00 00');
  const [address, setAddress] = useState(settings?.address || 'Toshkent sh.');
  const [currency, setCurrency] = useState(settings?.currency || 'so\'m');
  const [timezone, setTimezone] = useState(settings?.timezone || 'Asia/Tashkent');
  const [themeColor, setThemeColor] = useState(settings?.theme_color || '#4F46E5');
  const [bgColor, setBgColor] = useState(settings?.bg_color || '#0B0F17');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(settings?.logo_url || '');

  // Admin Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMessage, setPassMessage] = useState('');
  const [passError, setPassError] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (settings) {
      setName(settings.name || '');
      setLoginCode(settings.login_code || '');
      setPhone(settings.phone || '');
      setAddress(settings.address || '');
      setCurrency(settings.currency || 'so\'m');
      setTimezone(settings.timezone || 'Asia/Tashkent');
      setThemeColor(settings.theme_color || '#4F46E5');
      setBgColor(settings.bg_color || '#0B0F17');
      if (settings.logo_url) {
        setLogoPreview(settings.logo_url);
      }
    }
  }, [settings]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

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
      formData.append('bg_color', bgColor);
      if (logoFile) {
        formData.append('logo_file', logoFile);
      }

      const res = await api.updateSettings(formData);
      
      // Real-time styling updates
      document.documentElement.style.setProperty('--primary-color', themeColor);
      document.documentElement.style.setProperty('--bg-dark', bgColor);
      document.body.style.backgroundColor = bgColor;

      const newSettings = await api.getSettings();
      onUpdateSettings(newSettings);
      setMessage("✅ Tizim sozlamalari, logotip va yangi ranglar barcha foydalanuvchilar uchun muvaffaqiyatli saqlandi!");
    } catch (err) {
      setError(err.message || 'Sozlamalarni saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMessage('');
    setPassError('');

    if (newPassword !== confirmPassword) {
      setPassError("Yangi parollar bir-biriga mos kelmadi!");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await api.changePassword({
        user_id: user.id || 'admin_westminster',
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

  const presetBackgrounds = [
    { name: 'To\'q Qora (Default)', hex: '#0B0F17' },
    { name: 'Tungi Ko\'k (Midnight)', hex: '#0B132B' },
    { name: 'Chuqur Indigo (Deep)', hex: '#0F1123' },
    { name: 'Grafit Qorong\'u', hex: '#121212' },
    { name: 'Sokin Qora', hex: '#18181B' },
    { name: 'Zumrad Qorong\'u', hex: '#061E14' },
  ];

  const presetThemeColors = [
    { name: 'Westminster Indigo', hex: '#4F46E5' },
    { name: 'Moviy Ko\'k (Blue)', hex: '#2563EB' },
    { name: 'Zumrad Yashil (Green)', hex: '#10B981' },
    { name: 'Qizg\'ish Amber', hex: '#D97706' },
    { name: 'Binafsharang (Purple)', hex: '#9333EA' },
    { name: 'Pushti (Rose)', hex: '#E11D48' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '880px' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>⚙️ Tizim Sozlamalari</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          O'quv markaz brendingi, logotip rasmi, umumiy fon ranglari va admin parolini boshqarish
        </p>
      </div>

      {message && <div className="badge badge-success" style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}>{message}</div>}
      {error && <div className="badge badge-danger" style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}>{error}</div>}

      {/* Main Settings Card */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>
          🏢 O'quv Markaz Ma'lumotlari va Subdomen
        </h3>
        <form onSubmit={handleSubmit}>
          {/* Logo Upload Section - Fixed & Improved */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px'
          }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '16px',
              border: '2px solid var(--primary-color)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-card-hover)',
              flexShrink: 0,
              boxShadow: '0 4px 15px var(--primary-glow)'
            }}>
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="CRM Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary-color)' }}>WST</span>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>
                🖼️ O'quv Markazi Logotipi (Rasm)
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Ushbu rasm tizimning yuqori menyusi, yon paneli va kirish oynasida rasmiy brending sifatida chiqadi. (PNG, JPG, WEBP)
              </p>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={16} /> Yangi Rasm Tanlash
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </label>
              {logoFile && (
                <span style={{ marginLeft: '12px', fontSize: '0.82rem', color: 'var(--success)' }}>
                  ✓ Tanlandi: {logoFile.name}
                </span>
              )}
            </div>
          </div>

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

          {/* Color Customization: Theme Color & Background Color */}
          <div style={{ marginTop: '20px', padding: '18px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={18} color="var(--primary-color)" /> Ranglar Sozlamasi (Barcha Foydalanuvchilar Uchun Majburiy)
            </h4>

            {/* Background Color Picker */}
            <div style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                🎨 Tizim Orqa Fon Rangi (Background Color):
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                <input
                  type="color"
                  style={{ width: '48px', height: '40px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'transparent' }}
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '130px', fontFamily: 'monospace' }}
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Admin bu yerdan rang tanlasa, tizimga ulangan barcha o'qituvchilar va qurilmalarda avtomatik o'zgaradi!
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {presetBackgrounds.map(p => (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => setBgColor(p.hex)}
                    style={{
                      background: p.hex,
                      color: '#FFF',
                      border: bgColor.toLowerCase() === p.hex.toLowerCase() ? '2px solid #FFF' : '1px solid rgba(255,255,255,0.2)',
                      padding: '5px 12px',
                      borderRadius: '16px',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {bgColor.toLowerCase() === p.hex.toLowerCase() && <Check size={12} />}
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Primary Color Picker */}
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>
                🌟 Asosiy Tugmalar va Urg'u Rangi (Primary Brand Color):
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                <input
                  type="color"
                  style={{ width: '48px', height: '40px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'transparent' }}
                  value={themeColor}
                  onChange={e => setThemeColor(e.target.value)}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '130px', fontFamily: 'monospace' }}
                  value={themeColor}
                  onChange={e => setThemeColor(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {presetThemeColors.map(p => (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => setThemeColor(p.hex)}
                    style={{
                      background: p.hex,
                      color: '#FFF',
                      border: themeColor.toLowerCase() === p.hex.toLowerCase() ? '2px solid #FFF' : '1px solid rgba(255,255,255,0.2)',
                      padding: '5px 12px',
                      borderRadius: '16px',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {themeColor.toLowerCase() === p.hex.toLowerCase() && <Check size={12} />}
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem' }} disabled={saving}>
              <Save size={18} /> {saving ? 'Saqlanmoqda...' : 'Sozlamalar va Ranglarni Saqlash'}
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
          Tizim boshqaruvchisi hisobining maxfiy parolini xavfsiz yangilang.
        </p>

        {passMessage && <div className="badge badge-success" style={{ width: '100%', padding: '10px', marginBottom: '14px' }}>{passMessage}</div>}
        {passError && <div className="badge badge-danger" style={{ width: '100%', padding: '10px', marginBottom: '14px' }}>{passError}</div>}

        <form onSubmit={handleChangePassword}>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Joriy Parol:</label>
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
