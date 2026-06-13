'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import Dashboard from '@/components/dashboard/Dashboard';
import TransactionsPage from '@/components/transactions/TransactionsPage';
import RestaurantsPage from '@/components/restaurants/RestaurantsPage';
import SplitBillPage from '@/components/split/SplitBillPage';
import SettingsPage from '@/components/settings/SettingsPage';
import LoginScreen from '@/components/auth/LoginScreen';
import Onboarding from '@/components/auth/Onboarding';
import UpdatePasswordScreen from '@/components/auth/UpdatePasswordScreen';
import AddExpenseModal from '@/components/dashboard/AddExpenseModal';
import EditBudgetModal from '@/components/dashboard/EditBudgetModal';
import Icon from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { getDashboardData } from '@/lib/supabase/queries';
import { useLanguage } from '@/components/providers/LanguageProvider';

const supabase = createClient();

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
  const [errorText, setErrorText] = useState<string | null>(null);

  const changeRoute = (newRoute: string) => {
    setRoute(newRoute);
    if (typeof window !== 'undefined' && newRoute) {
      if (['login', 'onboarding', 'update_password', 'verified_success'].includes(newRoute)) {
        if (newRoute === 'login') {
          localStorage.removeItem('active_route');
        }
      } else {
        localStorage.setItem('active_route', newRoute);
      }
    }
  };

  useEffect(() => {
    // Safety timeout to prevent stuck loading screen
    const timeout = setTimeout(() => {
      if (route === null) {
        console.warn('Auth check timed out, falling back to login');
        changeRoute('login');
      }
    }, 5000);

    async function fetchCounts(userId: string) {
      try {
        const dashboard = await getDashboardData(userId);
        setCounts({
          transactions: dashboard.transactions?.length || 0
        });
      } catch (err) {
        console.error('fetchCounts failed:', err);
      }
    }

    const checkUser = async () => {
      try {
        const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const isVerified = urlParams.get('verified') === 'true';
        const isRecovery = urlParams.get('mode') === 'recovery';

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          changeRoute('login');
          setUser(null);
        } else {
          setUser(session.user);
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          if (isRecovery) {
            changeRoute('update_password');
          } else if (isVerified) {
            changeRoute('verified_success');
          } else {
            // Check if truly new user (has never created a budget in Supabase)
            let isNewUser = true;
            try {
              const { data: budgets, error } = await supabase
                .from('budgets')
                .select('id')
                .eq('user_id', session.user.id);
              
              if (error) throw error;
              isNewUser = !budgets || budgets.length === 0;
            } catch (err) {
              console.warn('Database budget check failed, falling back to localStorage:', err);
              const hasSeenOnboarding = typeof window !== 'undefined' ? localStorage.getItem(`onboarding_${session.user.id}`) : null;
              isNewUser = !hasSeenOnboarding;
            }
            
            if (isNewUser) {
              if (typeof window !== 'undefined') localStorage.removeItem(`onboarding_${session.user.id}`);
              changeRoute('onboarding');
            } else {
              if (typeof window !== 'undefined') localStorage.setItem(`onboarding_${session.user.id}`, 'true');
              
              let persistedRoute = 'dashboard';
              const saved = typeof window !== 'undefined' ? localStorage.getItem('active_route') : null;
              const validRoutes = ['dashboard', 'transactions', 'settings', 'restaurants', 'split'];
              if (saved && validRoutes.includes(saved)) {
                persistedRoute = saved;
              }
              changeRoute(persistedRoute);
            }
          }
          fetchCounts(session.user.id);
        }
      } catch (err: any) {
        console.error('checkUser failed:', err);
        setErrorText(err.message || String(err));
        // Fallback
        changeRoute('dashboard');
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (_event === 'PASSWORD_RECOVERY') {
          if (session) setUser(session.user);
          changeRoute('update_password');
          return;
        }
        if (!session) {
          changeRoute('login');
          setUser(null);
        } else {
          setUser(session.user);
          
          // Check if truly new user (has never created a budget in Supabase)
          let isNewUser = true;
          try {
            const { data: budgets, error } = await supabase
              .from('budgets')
              .select('id')
              .eq('user_id', session.user.id);
            
            if (error) throw error;
            isNewUser = !budgets || budgets.length === 0;
          } catch (err) {
            console.warn('Database budget check failed, falling back to localStorage:', err);
            const hasSeenOnboarding = typeof window !== 'undefined' ? localStorage.getItem(`onboarding_${session.user.id}`) : null;
            isNewUser = !hasSeenOnboarding;
          }

          setRoute(prev => {
            if (prev === 'login' || prev === null) {
              if (isNewUser) {
                if (typeof window !== 'undefined') localStorage.removeItem(`onboarding_${session.user.id}`);
                return 'onboarding';
              } else {
                if (typeof window !== 'undefined') localStorage.setItem(`onboarding_${session.user.id}`, 'true');
                
                let persistedRoute = 'dashboard';
                if (typeof window !== 'undefined') {
                  const saved = localStorage.getItem('active_route');
                  const validRoutes = ['dashboard', 'transactions', 'settings', 'restaurants', 'split'];
                  if (saved && validRoutes.includes(saved)) {
                    persistedRoute = saved;
                  }
                }
                return persistedRoute;
              }
            }
            return prev;
          });
          fetchCounts(session.user.id);
        }
      } catch (err: any) {
        console.error('onAuthStateChange callback failed:', err);
        setErrorText(err.message || String(err));
        changeRoute('dashboard');
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [refreshKey]);

  if (route === null) {
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', color: 'var(--t1)', padding: '24px', textAlign: 'center' }}>
        <div>
          <div style={{ marginBottom: '16px', fontWeight: 600 }}>Loading...</div>
          {errorText && (
            <div style={{ color: 'var(--rose)', fontSize: '14px', background: 'var(--rose-2)', padding: '12px', borderRadius: '8px', maxWidth: '400px', border: '1px solid var(--rose)' }}>
              Error: {errorText}
            </div>
          )}
        </div>
      </div>
    );
  }

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
            changeRoute(hasSeenOnboarding ? 'dashboard' : 'onboarding');
          }}
          style={{ minWidth: '200px', height: '48px' }}
        >
          Bắt đầu ngay
        </button>
      </div>
    );
  }

  if (route === 'update_password') return <UpdatePasswordScreen onDone={() => changeRoute('dashboard')} />;

  if (route === 'onboarding') return user ? <Onboarding userId={user.id} onComplete={() => changeRoute('dashboard')} /> : null;

  const renderContent = () => {
    switch (route) {
      case 'dashboard':
        return user ? <Dashboard key={refreshKey} user={user} onAdd={() => setAddOpen(true)} onEditBudget={() => setBudgetOpen(true)} onSeeAll={() => changeRoute('transactions')} /> : null;
      case 'transactions':
        return <TransactionsPage onAdd={() => setAddOpen(true)} refreshKey={refreshKey} />;
      case 'split':
        return user ? <SplitBillPage user={user} /> : null;
      case 'restaurants':
        return user ? <RestaurantsPage user={user} /> : null;
      case 'settings':
        return user ? <SettingsPage user={user} onLogout={() => changeRoute('login')} onProfileUpdate={() => setProfileRefreshKey(k => k + 1)} /> : null;
      default:
        return user ? <Dashboard user={user} onAdd={() => setAddOpen(true)} onEditBudget={() => setBudgetOpen(true)} onSeeAll={() => changeRoute('transactions')} /> : null;
    }
  };

  const getTitle = () => {
    switch (route) {
      case 'dashboard': return t('nav.dashboard');
      case 'transactions': return t('nav.transactions');
      case 'split': return t('nav.split');
      case 'restaurants': return t('nav.restaurants');
      case 'settings': return t('nav.settings');
      default: return 'QUẢN LÝ CHI TIÊU';
    }
  };

  const getBreadcrumbs = () => {
    return [];
  };

  return (
    <div className="app-container">
      <div className={`sidebar-area ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar
          currentRoute={route}
          setRoute={(r) => { changeRoute(r); setSidebarOpen(false); }}
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
        <button className={`bottom-nav-item${route === 'dashboard' ? ' active' : ''}`} onClick={() => changeRoute('dashboard')}>
          <Icon name="home" size={20} />
          <span>{t('nav.dashboard')}</span>
        </button>
        <button className={`bottom-nav-item${route === 'transactions' ? ' active' : ''}`} onClick={() => changeRoute('transactions')}>
          <Icon name="list" size={20} />
          <span>{t('nav.transactions')}</span>
        </button>
        <div className="bottom-nav-fab-wrap">
          <button className="bottom-nav-fab" onClick={() => setAddOpen(true)}>
            <Icon name="plus" size={22} />
          </button>
        </div>
        <button className={`bottom-nav-item${route === 'settings' ? ' active' : ''}`} onClick={() => changeRoute('settings')}>
          <Icon name="user" size={20} />
          <span>{t('settings.profile')}</span>
        </button>
      </nav>
    </div>
  );
}
