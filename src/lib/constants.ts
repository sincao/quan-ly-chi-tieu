export const DATA = {
  // ... (keeping other data same for reference if needed elsewhere)
};

export const NAV_MAIN = [
  { id: 'dashboard',   label: 'Tổng quan',     icon: 'home' },
  { id: 'transactions',label: 'Giao dịch',     icon: 'list' },
  { 
    id: 'squad',       
    label: 'Nhóm tiết kiệm', 
    icon: 'users',
    subItems: [
      { id: 'squad-campaigns', label: 'Chiến dịch', icon: 'list' },
      { id: 'squad-duels',     label: 'Duel 1v1',   icon: 'zap' },
      { id: 'squad-members',   label: 'Bạn bè',     icon: 'users' },
    ]
  },
  { id: 'leaderboard', label: 'Xếp hạng',      icon: 'trophy' },
];

export const NAV_SYSTEM = [
  { id: 'settings', label: 'Cài đặt', icon: 'settings' },
];
