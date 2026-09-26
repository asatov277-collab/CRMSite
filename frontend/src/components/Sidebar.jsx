import React from 'react';
import { 
  LayoutDashboard, Users, UserCheck, CalendarCheck, 
  CreditCard, MessageSquare, BookOpen, Settings, Archive, Database, Building2 
} from 'lucide-react';

export default function Sidebar({ currentView, onNavigate, user, settings, activeBranch, onClearActiveBranch }) {
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: '📊 Dashboard', icon: LayoutDashboard },
    { id: 'teachers', label: '👨‍🏫 O\'qituvchilar', icon: Users },
    { id: 'groups', label: '👥 Guruhlar', icon: UserCheck },
    { id: 'students', label: '👨‍🎓 O\'quvchilar', icon: Users },
    { id: 'attendance', label: '📅 Davomat', icon: CalendarCheck },
    { id: 'payments', label: '💳 To\'lovlar', icon: CreditCard },
    { id: 'chat', label: '💬 Chat', icon: MessageSquare },
    { id: 'materials', label: '📚 Darsliklar', icon: BookOpen },
    { id: 'archive', label: '📁 Arxiv', icon: Archive },
    { id: 'backup', label: '💾 Backup', icon: Database },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'branches', label: '🏢 Filiallar', icon: Building2 });
    menuItems.push({ id: 'settings', label: '⚙️ Sozlamalar', icon: Settings });
  }

  return (
    <aside style={{
      width: '260px',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {settings?.logo_url ? (
          <img
            src={settings.logo_url}
            alt="Logo"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              objectFit: 'cover',
              boxShadow: '0 4px 12px var(--primary-glow)',
              border: '1px solid var(--border-color)'
            }}
          />
        ) : (
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary-color), #818CF8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: '#FFF',
            fontSize: '1rem',
            boxShadow: '0 4px 12px var(--primary-glow)'
          }}>
            WST
          </div>
        )}
        <div style={{ overflow: 'hidden' }}>
          <h2 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {settings?.name || 'WESTMINSTER CRM'}
          </h2>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {settings?.login_code || 'westminster.uz'}
          </span>
        </div>
      </div>

      {/* Active Branch Indicator Banner */}
      {activeBranch && (
        <div style={{
          padding: '10px 16px',
          background: 'rgba(79, 70, 229, 0.15)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)', fontWeight: 700 }}>
            <Building2 size={15} />
            <span style={{ maxWidth: '130px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={activeBranch.name}>
              {activeBranch.name}
            </span>
          </div>
          <button
            onClick={onClearActiveBranch}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.72rem',
              textDecoration: 'underline'
            }}
            title="Barcha filiallar ko'rinishiga qaytish"
          >
            Barchasi
          </button>
        </div>
      )}

      {/* Nav list */}
      <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'var(--primary-glow)' : 'transparent',
                color: isActive ? '#FFF' : 'var(--text-muted)',
                border: isActive ? '1px solid var(--primary-color)' : '1px solid transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer',
                marginBottom: '4px',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={18} color={isActive ? 'var(--primary-color)' : 'currentColor'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Subdomain footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-dim)'
      }}>
        WESTMINSTER CRM v1.0 • Subdomain: <span style={{ color: 'var(--primary-color)' }}>{settings?.login_code || 'westminster.uz'}</span>
      </div>
    </aside>
  );
}
