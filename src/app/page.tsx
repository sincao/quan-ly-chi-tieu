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
import AddExpenseModal from '@/components/dashboard/AddExpenseModal';
import EditBudgetModal from '@/components/dashboard/EditBudgetModal';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { getDashboardData, getSquadData } from '@/lib/supabase/queries';

export default function Home() {
  const [route, setRoute] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAddOpen, setAddOpen] = useState(false);
  const [isBudgetOpen, setBudgetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setRoute('login');
        setUser(null);
      } else {
        setUser(session.user);
        const hasSeenOnboarding = localStorage.getItem(`onboarding_${session.user.id}`);
        if (!hasSeenOnboarding) {
          setRoute('onboarding');
        } else {
          setRoute('dashboard');
        }
        fetchCounts(session.user.id);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
  }, [refreshKey, supabase.auth]);

  if (route === null) return <div style={{ height: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>Loading...</div>;

  if (route === 'login') {
    return <LoginScreen onLogin={() => setRoute('dashboard')} />;
  }

  if (route === 'onboarding') {
    return user ? <Onboarding userId={user.id} onComplete={() => setRoute('dashboard')} /> : null;
  }

  const renderContent = () => {
    switch (route) {
      case 'dashboard':
        return user ? (
          <Dashboard 
            key={refreshKey}
            user={user} 
            onAdd={() => setAddOpen(true)} 
            onEditBudget={() => setBudgetOpen(true)}
            onSeeAll={() => setRoute('transactions')}
          />
        ) : null;
      case 'transactions':
        return <TransactionsPage onAdd={() => setAddOpen(true)} refreshKey={refreshKey} />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'squad':
      case 'squad-campaigns':
      case 'squad-duels':
      case 'squad-members':
        return user ? (
          <SquadPage 
            user={user} 
            subRoute={
              route === 'squad' || route === 'squad-campaigns' ? 'campaigns' : 
              route === 'squad-duels' ? 'duels' : 'members'
            } 
          />
        ) : null;
      case 'settings':
        return user ? <SettingsPage user={user} onLogout={() => setRoute('login')} /> : null;
      default:
        return user ? <Dashboard user={user} onAdd={() => setAddOpen(true)} onEditBudget={() => setBudgetOpen(true)} onSeeAll={() => setRoute('transactions')} /> : null;
    }
  };

  const getTitle = () => {
    if (route?.startsWith('squad')) return 'Nhóm tiết kiệm';
    switch (route) {
      case 'dashboard': return 'Tổng quan';
      case 'transactions': return 'Giao dịch';
      case 'leaderboard': return 'Xếp hạng';
      case 'settings': return 'Cài đặt';
      default: return 'Quản Lý Chi Tiêu';
    }
  };

  const getBreadcrumbs = () => {
    if (route?.startsWith('squad-')) {
      const sub = route.split('-')[1];
      const subLabel = sub === 'campaigns' ? 'Chiến dịch' : sub === 'duels' ? 'Duel 1v1' : 'Bạn bè';
      return [subLabel];
    }
    return [];
  };

  return (
    <div className="app-container">
      <div className={`sidebar-area ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar 
          currentRoute={route} 
          setRoute={(r) => {
            setRoute(r);
            setSidebarOpen(false);
          }} 
          onAdd={() => setAddOpen(true)}
          open={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          counts={counts}
        />
      </div>
      {isSidebarOpen && <div className="sidebar-scrim" onClick={() => setSidebarOpen(false)}></div>}
      
      <div className="topbar-area">
        <Topbar title={getTitle()} breadcrumbs={getBreadcrumbs()} />
      </div>
      
      <main className="main-area">
        {renderContent()}
      </main>

      {user && (
        <AddExpenseModal 
          open={isAddOpen} 
          onClose={() => setAddOpen(false)} 
          userId={user.id}
          onSuccess={() => setRefreshKey(prev => prev + 1)}
        />
      )}
      {user && (
        <EditBudgetModal 
          open={isBudgetOpen} 
          onClose={() => setBudgetOpen(false)} 
          userId={user.id}
          currentAmount={0} 
          onSuccess={() => {
            console.log('Budget updated successfully');
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}
