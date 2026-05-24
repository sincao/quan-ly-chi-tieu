'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import Dashboard from '@/components/dashboard/Dashboard';
import TransactionsPage from '@/components/transactions/TransactionsPage';
import LeaderboardPage from '@/components/leaderboard/LeaderboardPage';
import SquadPage from '@/components/squad/SquadPage';
import SettingsPage from '@/components/settings/SettingsPage';
import LoginScreen from '@/components/auth/LoginScreen';
import Onboarding from '@/components/auth/Onboarding';
import UpdatePasswordScreen from '@/components/auth/UpdatePasswordScreen';
import AddExpenseModal from '@/components/dashboard/AddExpenseModal';
import EditBudgetModal from '@/components/dashboard/EditBudgetModal';
import Icon from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { getDashboardData, getSquadData } from '@/lib/supabase/queries';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function Home() {
  const { t } = useLanguage();
  const [route, setRoute] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAddOpen, setAddOpen] = useState(false);
  const [isBudgetOpen, setBudgetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [counts, setCounts] = useState<{ [key: string]: number }>({});

  const supabase = createClient();

  useEffect(() => {
    async function fetchCounts(userId: string) {
      const [dashboard, squad] = await Promise.all([
        getDashboardData(userId),
        getSquadData(userId)
      ]);
      setCounts({
        transactions: dashboard.transactions?.length || 0,
        squad: squad.campaigns?.length || 0
      });
    }

    const checkUser = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const isVerified = urlParams.get('verified') === 'true';
      const isRecovery = urlParams.get('mode') === 'recovery';

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setRoute('login');
        setUser(null);
      } else {
        setUser(session.user);
        window.history.replaceState({}, document.title, window.location.pathname);
        if (isRecovery) {
          setRoute('update_password');
        } else if (isVerified) {
          setRoute('verified_success');
        } else {
          const hasSeenOnboarding = localStorage.getItem(`onboarding_${session.user.id}`);
          if (!hasSeenOnboarding) setRoute('onboarding');
          else setRoute('dashboard');
        }
        fetchCounts(session.user.id);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        if (session) setUser(session.user);
        setRoute('update_password');
        return;
      }
      if (!session) {
        setRoute('login');
        setUser(null);
      } else {
        setUser(session.user);
        setRoute(prev => {
          if (prev === 'login' || prev === null) {
            const hasSeenOnboarding = localStorage.getItem(`onboarding_${session.user.id}`);
            return hasSeenOnboarding ? 'dashboard' : 'onboarding';
          }
          return prev;
        });
        fetchCounts(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshKey]);

  if (route === null) return <div style={{ height: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>Loading...</div>;

  if (route === 'login') return <LoginScreen onLogin={() => setRefreshKey(prev => prev + 1)} />;
  
  if (route === 'verified_success') {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--bg)',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{ 
          background: 'rgba(34, 197, 94, 0.1)', 
          color: '#22c55e', 
          width: '64px', 
          height: '64px', 
          borderRadius: '50%', 
          display: 'grid', 
          placeItems: 'center',
          marginBottom: '24px'
        }}>
          <Icon name="check" size={32} />
        </div>
        <h1 style={{ marginBottom: '12px', fontSize: '24px', fontWeight: 800 }}>Xác minh thành công!</h1>
        <p style={{ color: 'var(--t2)', maxWidth: '400px', marginBottom: '32px', lineHeight: 1.5 }}>
          Tài khoản của bạn đã được kích hoạt. Hãy bắt đầu hành trình quản lý chi tiêu thông minh ngay bây giờ.
        </p>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            const hasSeenOnboarding = localStorage.getItem(`onboarding_${user?.id}`);
            setRoute(hasSeenOnboarding ? 'dashboard' : 'onboarding');
          }}
          style={{ minWidth: '200px', height: '48px' }}
        >
          Bắt đầu ngay
        </button>
      </div>
    );
  }

  if (route === 'update_password') return <UpdatePasswordScreen onDone={() => setRoute('dashboard')} />;

  if (route === 'onboarding') return user ? <Onboarding userId={user.id} onComplete={() => setRoute('dashboard')} /> : null;

  const renderContent = () => {
    switch (route) {
      case 'dashboard':
        return user ? <Dashboard key={refreshKey} user={user} onAdd={() => setAddOpen(true)} onEditBudget={() => setBudgetOpen(true)} onSeeAll={() => setRoute('transactions')} /> : null;
      case 'transactions':
        return <TransactionsPage onAdd={() => setAddOpen(true)} refreshKey={refreshKey} />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'squad':
      case 'squad-campaigns':
      case 'squad-duels':
      case 'squad-members':
        return user ? <SquadPage user={user} subRoute={route === 'squad' || route === 'squad-campaigns' ? 'campaigns' : route === 'squad-duels' ? 'duels' : 'members'} /> : null;
      case 'settings':
        return user ? <SettingsPage user={user} onLogout={() => setRoute('login')} onProfileUpdate={() => setProfileRefreshKey(k => k + 1)} /> : null;
      default:
        return user ? <Dashboard user={user} onAdd={() => setAddOpen(true)} onEditBudget={() => setBudgetOpen(true)} onSeeAll={() => setRoute('transactions')} /> : null;
    }
  };

  const getTitle = () => {
    if (route?.startsWith('squad')) return t('nav.squad');
    switch (route) {
      case 'dashboard': return t('nav.dashboard');
      case 'transactions': return t('nav.transactions');
      case 'leaderboard': return t('nav.leaderboard');
      case 'settings': return t('nav.settings');
      default: return 'QUẢN LÝ CHI TIÊU';
    }
  };

  const getBreadcrumbs = () => {
    if (route?.startsWith('squad-')) {
      const sub = route.split('-')[1];
      const subLabel = sub === 'campaigns' ? t('nav.campaigns') : sub === 'duels' ? t('nav.duels') : t('nav.members');
      return [subLabel];
    }
    return [];
  };

  return (
    <div className="app-container">
      <div className={`sidebar-area ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar
          currentRoute={route}
          setRoute={(r) => { setRoute(r); setSidebarOpen(false); }}
          open={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          counts={counts}
          profileRefreshKey={profileRefreshKey}
        />
      </div>
      {isSidebarOpen && <div className="sidebar-scrim" onClick={() => setSidebarOpen(false)}></div>}
      <div className="topbar-area"><Topbar title={getTitle()} breadcrumbs={getBreadcrumbs()} /></div>
      <main className="main-area">{renderContent()}</main>
      {user && <AddExpenseModal open={isAddOpen} onClose={() => setAddOpen(false)} userId={user.id} onSuccess={() => setRefreshKey(prev => prev + 1)} />}
      {user && <EditBudgetModal open={isBudgetOpen} onClose={() => setBudgetOpen(false)} userId={user.id} currentAmount={0} onSuccess={() => setRefreshKey(prev => prev + 1)} />}
      <nav className="bottom-nav">
        <button className={`bottom-nav-item${route === 'dashboard' ? ' active' : ''}`} onClick={() => setRoute('dashboard')}>
          <Icon name="home" size={20} />
          <span>{t('nav.dashboard')}</span>
        </button>
        <button className={`bottom-nav-item${route === 'transactions' ? ' active' : ''}`} onClick={() => setRoute('transactions')}>
          <Icon name="list" size={20} />
          <span>{t('nav.transactions')}</span>
        </button>
        <div className="bottom-nav-fab-wrap">
          <button className="bottom-nav-fab" onClick={() => setAddOpen(true)}>
            <Icon name="plus" size={22} />
          </button>
        </div>
        <button className={`bottom-nav-item${route?.startsWith('squad') ? ' active' : ''}`} onClick={() => setRoute('squad')}>
          <Icon name="users" size={20} />
          <span>Squad</span>
        </button>
        <button className={`bottom-nav-item${route === 'leaderboard' ? ' active' : ''}`} onClick={() => setRoute('leaderboard')}>
          <Icon name="trophy" size={20} />
          <span>{t('nav.leaderboard')}</span>
        </button>
      </nav>
    </div>
  );
}
