import React from 'react';
import { 
  LayoutDashboard, Users, UserCheck, CalendarCheck, 
  CreditCard, MessageSquare, BookOpen, Settings, Archive, Database 
} from 'lucide-react';

export default function Sidebar({ currentView, onNavigate, user, settings }) {
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
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--primary-color), #818CF8)',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          fontWeight: 800,
          color: '#FFF',
          fontSize: '1rem',
          boxShadow: '0 4px 12px var(--primary-glow)'
        }}>
          WST
        </div>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {settings?.name ? settings.name.split(' ')[0] : 'WESTMINSTER'} CRM
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {settings?.login_code || 'westminster.uz'}
          </span>
        </div>
      </div>

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
