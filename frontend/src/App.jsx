import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { offlineSync } from './services/offlineSync';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import GlobalSearchModal from './components/GlobalSearchModal';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TeachersPage from './pages/TeachersPage';
import StudentsPage from './pages/StudentsPage';
import GroupsPage from './pages/GroupsPage';
import AttendancePage from './pages/AttendancePage';
import PaymentsPage from './pages/PaymentsPage';
import ChatPage from './pages/ChatPage';
import MaterialsPage from './pages/MaterialsPage';
import SettingsPage from './pages/SettingsPage';
import BackupPage from './pages/BackupPage';
import ArchivePage from './pages/ArchivePage';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [settings, setSettings] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
    // Initialize offline sync auto listener
    offlineSync.initAutoSync((syncedCount) => {
      alert(`🎉 Internet qaytdi! ${syncedCount} ta offline davomat yozuvi serverga yuborildi.`);
    });
  }, []);

  useEffect(() => {
    if (settings?.theme_color) {
      document.documentElement.style.setProperty('--primary-color', settings.theme_color);
    }
  }, [settings]);

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleSearchResultSelect = (type, item) => {
    if (type === 'students') setCurrentView('students');
    else if (type === 'groups') setCurrentView('groups');
    else if (type === 'teachers') setCurrentView('teachers');
  };

  if (!user) {
    return <LoginPage onLoginSuccess={setUser} settings={settings} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation Drawer */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        user={user}
        settings={settings}
      />

      {/* Main Container */}
      <div className="main-content">
        {/* Top Navbar */}
        <Navbar
          user={user}
          settings={settings}
          onOpenSearch={() => setIsSearchOpen(true)}
          onLogout={handleLogout}
          onNavigate={setCurrentView}
        />

        {/* Page Content */}
        <main className="page-body">
          {currentView === 'dashboard' && <DashboardPage user={user} onNavigate={setCurrentView} />}
          {currentView === 'teachers' && <TeachersPage user={user} onUpdateCurrentUser={setUser} />}
          {currentView === 'students' && <StudentsPage user={user} />}
          {currentView === 'groups' && <GroupsPage user={user} />}
          {currentView === 'attendance' && <AttendancePage user={user} />}
          {currentView === 'payments' && <PaymentsPage user={user} />}
          {currentView === 'chat' && <ChatPage user={user} />}
          {currentView === 'materials' && <MaterialsPage user={user} />}
          {currentView === 'archive' && <ArchivePage />}
          {currentView === 'backup' && <BackupPage />}
          {currentView === 'settings' && <SettingsPage settings={settings} onUpdateSettings={setSettings} />}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSearchResultSelect}
      />
    </div>
  );
}
