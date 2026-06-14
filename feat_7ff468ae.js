// Static demo data — v2 (web-native)
const DATA = {
  user: {
    name: 'Sin Sin',
    handle: '@sinsin',
    email: 'sinsin@example.com',
    initials: 'SS',
    rank: 'Bạch Kim',
    rankNo: 5,
  },
  budget: {
    monthly: 5000000,
    spent: 2870000,
    saved: 480000,
    daysLeft: 18,
    streak: 14,
  },
  categories: [
    { id: 'food',  label: 'Ăn uống',   icon: 'food',  color: '#E11D48', amount: 1240000, pct: 43 },
    { id: 'move',  label: 'Di chuyển', icon: 'car',   color: '#2563EB', amount: 680000,  pct: 24 },
    { id: 'shop',  label: 'Mua sắm',   icon: 'shop',  color: '#D97706', amount: 540000,  pct: 19 },
    { id: 'save',  label: 'Tiết kiệm', icon: 'piggy', color: '#16A34A', amount: 480000,  pct: 9 },
    { id: 'other', label: 'Khác',      icon: 'tag',   color: '#6B7280', amount: 130000,  pct: 5 },
  ],
  transactions: [
    { id: 't1', name: 'Trà sữa Phúc Long',  cat: 'food', amount: 65000,  note: 'cốc số 4 của tuần',     date: '22/05/2026', time: '14:32' },
    { id: 't2', name: 'Grab về nhà',        cat: 'move', amount: 48000,  note: 'lại lười đi bộ',        date: '22/05/2026', time: '09:10' },
    { id: 't3', name: 'Shopee – áo thun',   cat: 'shop', amount: 189000, note: 'flash sale mà',         date: '21/05/2026', time: '22:45' },
    { id: 't4', name: 'Bỏ heo',             cat: 'save', amount: 200000, note: 'cảm ơn bản thân',       date: '21/05/2026', time: '20:00', kind: 'save' },
    { id: 't5', name: 'Cơm tấm Phụng',      cat: 'food', amount: 45000,  note: '',                       date: '20/05/2026', time: '12:15' },
    { id: 't6', name: 'Xăng Petrolimex',    cat: 'move', amount: 120000, note: '',                       date: '19/05/2026', time: '18:02' },
    { id: 't7', name: 'Cafe deadline',      cat: 'food', amount: 55000,  note: 'họp xong còn deadline', date: '19/05/2026', time: '09:30' },
    { id: 't8', name: 'Tiki – sách',        cat: 'shop', amount: 280000, note: '"Atomic Habits"',        date: '18/05/2026', time: '14:00' },
    { id: 't9', name: 'Highlands Coffee',   cat: 'food', amount: 49000,  note: '',                       date: '18/05/2026', time: '08:20' },
    { id: 't10', name: 'Grab Bike',         cat: 'move', amount: 32000,  note: 'mưa quá',                date: '17/05/2026', time: '17:45' },
    { id: 't11', name: 'Lotteria',          cat: 'food', amount: 89000,  note: 'cravings cuối tuần',    date: '16/05/2026', time: '19:10' },
    { id: 't12', name: 'Quỹ tiết kiệm',     cat: 'save', amount: 280000, note: '',                       date: '15/05/2026', time: '08:00', kind: 'save' },
  ],
  roast:
    'Bạn đã uống 4 ly trà sữa tuần này. Tổng 240k — đủ mua 1 cuốn sách self-help mà bạn cũng chưa chắc đọc. 🧋',
  weekSpend: [
    { d: 'T2', food: 65, move: 48, shop: 0,   other: 12 },
    { d: 'T3', food: 70, move: 32, shop: 189, other: 0 },
    { d: 'T4', food: 95, move: 0,  shop: 0,   other: 30 },
    { d: 'T5', food: 49, move: 120, shop: 280, other: 0 },
    { d: 'T6', food: 55, move: 0,  shop: 0,   other: 15 },
    { d: 'T7', food: 134, move: 48, shop: 0,  other: 0 },
    { d: 'CN', food: 65, move: 0,  shop: 0,   other: 0, today: true },
  ],
  campaigns: [
    {
      id: 'c1', name: 'Tháng Không Trà Sữa', emoji: '🧋',
      desc: 'Cả squad không uống trà sữa suốt tháng 5',
      daysLeft: 12, progress: 65,
      members: [
        { initials: 'MT', name: 'Minh Thư', status: 'good' },
        { initials: 'AT', name: 'Anh Tuấn', status: 'good' },
        { initials: 'HN', name: 'Hoàng Nam', status: 'good' },
        { initials: 'HG', name: 'Hương Giang', status: 'bad' },
        { initials: 'SS', name: 'Sin Sin', status: 'good', me: true },
      ],
    },
    {
      id: 'c2', name: 'Đi bộ thay Grab', emoji: '🚶',
      desc: 'Tiết kiệm 500k tiền xe trong 30 ngày',
      daysLeft: 5, progress: 88,
      members: [
        { initials: 'KL', name: 'Khánh Linh', status: 'good' },
        { initials: 'PT', name: 'Phương Trinh', status: 'good' },
        { initials: 'SS', name: 'Sin Sin', status: 'good', me: true },
      ],
    },
  ],
  duels: [
    {
      id: 'd1', title: 'Ai tiêu ít hơn tuần này?',
      stake: '50.000đ + 1 ly trà sữa',
      daysLeft: 3,
      a: { name: 'Sin Sin', initials: 'SS', amount: 420000 },
      b: { name: 'Quốc Bảo', initials: 'QB', amount: 580000 },
      youAhead: true,
    },
    {
      id: 'd2', title: 'Không order trong 7 ngày',
      stake: 'Người thua nấu cơm cả tuần',
      daysLeft: 4,
      a: { name: 'Sin Sin', initials: 'SS', amount: 2 },
      b: { name: 'Thuỳ Linh', initials: 'TL', amount: 0 },
      unit: 'lần vi phạm',
      youAhead: false,
    },
  ],
  leaderboard: [
    { rank: 1, name: 'Minh Anh',     initials: 'MA', streak: 23, save: 2850000, win: 78 },
    { rank: 2, name: 'Thuỳ Linh',    initials: 'TL', streak: 19, save: 2620000, win: 71 },
    { rank: 3, name: 'Quốc Bảo',     initials: 'QB', streak: 16, save: 2410000, win: 69 },
    { rank: 4, name: 'Hoàng Nam',    initials: 'HN', streak: 14, save: 2080000, win: 66 },
    { rank: 5, name: 'Sin Sin',      initials: 'SS', streak: 14, save: 1950000, win: 63, me: true },
    { rank: 6, name: 'Khánh Linh',   initials: 'KL', streak: 12, save: 1820000, win: 60 },
    { rank: 7, name: 'Anh Tuấn',     initials: 'AT', streak: 11, save: 1640000, win: 58 },
    { rank: 8, name: 'Phương Trinh', initials: 'PT', streak: 9,  save: 1430000, win: 54 },
    { rank: 9, name: 'Hương Giang',  initials: 'HG', streak: 5,  save: 980000,  win: 41 },
  ],
};

const fmt = (n) => n.toLocaleString('vi-VN');
const catById = (id) => DATA.categories.find(c => c.id === id);

window.DATA = DATA;
window.fmt = fmt;
window.catById = catById;
