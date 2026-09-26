import React, { useState, useEffect } from 'react';
import { Search, LogOut, Wifi, WifiOff, User, Settings as SettingsIcon } from 'lucide-react';
import { offlineSync } from '../services/offlineSync';

export default function Navbar({ user, settings, onOpenSearch, onLogout, onNavigate }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncs, setPendingSyncs] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      setPendingSyncs(offlineSync.getPendingCount());
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <header style={{
      height: '70px',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justify: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Search trigger */}
      <div 
        onClick={onOpenSearch}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '8px 16px',
          cursor: 'pointer',
          width: '320px',
          color: 'var(--text-muted)'
        }}
      >
        <Search size={18} />
        <span style={{ fontSize: '0.9rem' }}>Ism, guruh, tel qidiruv...</span>
      </div>

      {/* Center title & User controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Offline status indicator */}
        {!isOnline ? (
          <div className="badge badge-danger" title="Internet uzilgan, ma'lumotlar lokal saqlanmoqda">
            <WifiOff size={14} /> Offline {pendingSyncs > 0 && `(${pendingSyncs})`}
          </div>
        ) : (
          pendingSyncs > 0 && (
            <div className="badge badge-warning" title="Sinxronizatsiya qilinmoqda">
              <Wifi size={14} /> Synced {pendingSyncs}
            </div>
          )
        )}

        {/* User profile capsule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            overflow: 'hidden'
          }}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={20} color="#fff" />
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.name || 'Foydalanuvchi'}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user?.role === 'admin' ? '👑 Admin' : '👨‍🏫 O\'qituvchi'}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={onLogout} 
          className="btn btn-secondary btn-sm"
          title="Tizimdan chiqish"
          style={{ color: 'var(--danger)' }}
        >
          <LogOut size={16} /> Chiqish
        </button>
      </div>
    </header>
  );
}
