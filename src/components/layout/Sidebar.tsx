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
}

const Sidebar: React.FC<SidebarProps> = ({ currentRoute, setRoute, open, onClose, user, counts }) => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['squad']);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    async function loadProfile() {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, display_name')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
    }
    loadProfile();
  }, [user, supabase]);

  useEffect(() => {
    if (currentRoute?.startsWith('squad')) {
      if (!expandedGroups.includes('squad')) setExpandedGroups([...expandedGroups, 'squad']);
    }
  }, [currentRoute]);

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

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const NavItem = ({ item, isSub = false }: { item: any, isSub?: boolean }) => {
    const count = counts?.[item.id];
    const isActive = currentRoute === item.id || (item.subItems && currentRoute?.startsWith(item.id));
    const isExpanded = expandedGroups.includes(item.id);

    // Dynamic translation key based on ID
    const tKey = item.id.startsWith('squad-') ? item.id.replace('squad-', '') : item.id;

    return (
      <div className="sb-nav-item-wrapper">
        <button
          className={(isActive && !item.subItems ? 'active' : '') + (isSub ? ' sub' : '')}
          onClick={() => {
            if (item.subItems) {
              toggleGroup(item.id);
            } else {
              setRoute(item.id);
              onClose && onClose();
            }
          }}
          style={{
            width: '100%',
            borderRadius: 0,
            paddingLeft: isSub ? '44px' : '16px',
            paddingRight: '16px',
            background: (isActive && !item.subItems) ? 'rgba(255,255,255,0.15)' : 'transparent'
          }}
        >
          <span className="ico" style={{ opacity: isActive ? 1 : 0.7 }}>
            <Icon name={item.icon as IconName} size={isSub ? 13 : 15} />
          </span>
          <span style={{ flex: 1, fontWeight: isActive ? 700 : 500 }}>{t(`nav.${tKey}`)}</span>
          {item.subItems && (
            <span style={{ transform: isExpanded ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s', opacity: 0.5 }}>
              <Icon name="chevron-down" size={12} />
            </span>
          )}
          {!item.subItems && count != null && count > 0 && <span className="count">{count}</span>}
        </button>

        {item.subItems && isExpanded && (
          <div className="sb-sub-nav">
            {item.subItems.map((sub: any) => (
              <NavItem key={sub.id} item={sub} isSub />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={'sidebar' + (open ? ' open' : '')}>
      <div className="sb-brand" style={{ padding: '24px 16px' }}>
        <div className="sb-mark"><Icon name="zap" size={16} /></div>
        <div>
          <div className="sb-name">QUẢN LÝ CHI TIÊU</div>
          <div className="sb-sub">stop burning $$</div>
        </div>
      </div>

      <div className="sb-group-label" style={{ paddingLeft: '16px' }}>Workspace</div>
      <nav className="sb-nav" style={{ padding: 0 }}>
        {NAV_MAIN.map(item => <NavItem item={item} key={item.id} />)}
      </nav>

      <div className="sb-spacer"></div>

      <nav className="sb-nav" style={{ padding: 0, marginBottom: '12px' }}>
        {NAV_SYSTEM.map(item => <NavItem item={item} key={item.id} />)}
      </nav>

      <div className="sb-foot" style={{ padding: '16px' }}>
        <div className="sb-foot-user">
          <div className="avatar" style={{ background: '#6938E8', color: '#fff' }}>{getInitials()}</div>
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
