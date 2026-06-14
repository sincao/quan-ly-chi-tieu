'use client';

import React, { useState, useEffect } from 'react';
import Icon, { IconName } from '@/components/ui/Icon';
import { NAV_MAIN, NAV_SYSTEM } from '@/lib/constants';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface SidebarProps {
  currentRoute: string | null;
  setRoute: (route: string) => void;
  open?: boolean;
  onClose?: () => void;
  user: User | null;
  counts?: { [key: string]: number };
  profileRefreshKey?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentRoute, setRoute, open, onClose, user, counts, profileRefreshKey }) => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    async function loadProfile() {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, display_name, avatar_url')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
    }
    loadProfile();
  }, [user, profileRefreshKey]);

  const getInitials = () => {
    if (profile?.last_name && profile?.first_name) {
      return (profile.last_name[0] + profile.first_name[0]).toUpperCase();
    }
    if (profile?.display_name) {
      const parts = profile.display_name.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
      return profile.display_name.substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || '??';
  };
  
  const displayName = profile?.display_name || 
                      user?.user_metadata?.display_name || 
                      user?.user_metadata?.full_name || 
                      user?.email?.split('@')[0] || 
                      'Member';

  const userEmail = user?.email || 'Not logged in';

  const NavItem = ({ item }: { item: any }) => {
    const count = counts?.[item.id];
    const isActive = currentRoute === item.id;

    return (
      <div className="sb-nav-item-wrapper">
        <button
          className={isActive ? 'active' : ''}
          onClick={() => {
            setRoute(item.id);
            onClose && onClose();
          }}
          style={{
            width: '100%',
            borderRadius: 0,
            paddingLeft: '16px',
            paddingRight: '16px',
            background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent'
          }}
        >
          <span className="ico" style={{ opacity: isActive ? 1 : 0.7 }}>
            <Icon name={item.icon as IconName} size={15} />
          </span>
          <span style={{ flex: 1, fontWeight: isActive ? 700 : 500 }}>{t(`nav.${item.id}`)}</span>
          {count != null && count > 0 && <span className="count">{count}</span>}
        </button>
      </div>
    );
  };

  return (
    <aside className={'sidebar' + (open ? ' open' : '')}>
      <div className="sb-brand" style={{ padding: '24px 16px' }}>
        <div className="sb-mark" style={{ background: 'transparent', width: '32px', height: '32px', overflow: 'hidden' }}>
          <img src="/favicon-32x32.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <div className="sb-name">QUẢN LÝ CHI TIÊU</div>
          <div className="sb-sub">stop burning $$</div>
        </div>
      </div>

      <div className="sb-group-label" style={{ paddingLeft: '16px' }}>{t('nav.workspace')}</div>
      <nav className="sb-nav" style={{ padding: 0 }}>
        {NAV_MAIN.map(item => <NavItem item={item} key={item.id} />)}
      </nav>

      <div className="sb-spacer"></div>

      <nav className="sb-nav" style={{ padding: 0, marginBottom: '12px' }}>
        {NAV_SYSTEM.map(item => <NavItem item={item} key={item.id} />)}
      </nav>

      <div className="sb-foot" style={{ padding: '16px' }}>
        <div className="sb-foot-user">
          <div className="avatar" style={{ background: '#6938E8', color: '#fff', overflow: 'hidden' }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : getInitials()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="nm truncate">{displayName}</div>
            <div className="em truncate">{userEmail}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
