import React, { useState, useEffect } from 'react';
import { Search, LogOut, Wifi, WifiOff, User, Building2, X } from 'lucide-react';
import { offlineSync } from '../services/offlineSync';

export default function Navbar({ user, settings, onOpenSearch, onLogout, onNavigate, activeBranch, onClearActiveBranch }) {
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
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Left Search & Branch info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            width: '280px',
            color: 'var(--text-muted)'
          }}
        >
          <Search size={18} />
          <span style={{ fontSize: '0.9rem' }}>Ism, guruh, tel qidiruv...</span>
        </div>

        {/* Active Branch Chip */}
        {activeBranch && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(79, 70, 229, 0.15)',
            border: '1px solid var(--primary-color)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.84rem',
            color: '#FFF'
          }}>
            <Building2 size={16} color="var(--primary-color)" />
            <span>Faol filial: <strong>{activeBranch.name}</strong></span>
            <button
              onClick={onClearActiveBranch}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#FFF',
                marginLeft: '4px'
              }}
              title="Barcha filiallar rejimiga qaytish"
            >
              <X size={12} />
            </button>
          </div>
        )}
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
