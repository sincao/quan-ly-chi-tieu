'use client';

import React, { useState, useEffect } from 'react';
import Icon, { IconName } from '@/components/ui/Icon';
import { getDashboardData } from '@/lib/supabase/queries';
import { User } from '@supabase/supabase-js';
import { calculateStreak } from '@/lib/finance/calculations';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface DashboardProps {
  user: User;
  onAdd: () => void;
  onEditBudget: () => void;
  onSeeAll: () => void;
}

const Kpi: React.FC<any> = ({ primary, label, value, unit, delta, deltaDir, meta, bar, icon, onAction }) => (
  <div className={`kpi ${primary ? 'primary' : ''}`}>
    <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon && <Icon name={icon} size={14} />}
        <span>{label}</span>
      </div>
      {onAction && (
        <button onClick={(e) => { e.stopPropagation(); onAction(); }} className="hover:bg-white/20 transition-all" style={{ opacity: 0.8, padding: '4px', cursor: 'pointer', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>
          <Icon name="edit" size={12} />
        </button>
      )}
    </div>
    <div className="kpi-value">{value}{unit && <span className="unit">{unit}</span>}</div>
    <div className="kpi-meta">{delta && <span className={`kpi-delta ${deltaDir || ''}`}>{delta}</span>}{meta && <span>{meta}</span>}</div>
    {bar !== undefined && <div className="kpi-bar"><i style={{ width: `${bar}%` }}></i></div>}
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user, onAdd, onEditBudget, onSeeAll }) => {
  const { t, locale } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsPeriod, setStatsPeriod] = useState<'month' | '3months' | 'year'>('month');
  const [dailyPeriod, setDailyPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    async function loadData() {
      const dbData = await getDashboardData(user.id);
      setData(dbData);
      setLoading(false);
    }
    loadData();
  }, [user.id]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('common.loading')}</div>;

  const budgetLimit = data.budget?.amount_limit || 0;
  const allTransactions = data.transactions || [];
  
  const currentMonthTransactions = allTransactions.filter((t: any) => {
    const d = new Date(t.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const filteredStatsTransactions = allTransactions.filter((t: any) => {
    const d = new Date(t.date);
    const now = new Date();
    if (statsPeriod === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (statsPeriod === '3months') {
      const limit = new Date();
      limit.setMonth(now.getMonth() - 3);
      return d >= limit;
    }
    return d.getFullYear() === now.getFullYear();
  });

  const totalSpentKPI = currentMonthTransactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const totalIncomeKPI = currentMonthTransactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const totalSpentStats = filteredStatsTransactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const remainingBudget = Math.max(0, budgetLimit - totalSpentKPI);
  const savedValue = Math.max(0, totalIncomeKPI - totalSpentKPI);
  const pctSpent = budgetLimit > 0 ? Math.round((totalSpentKPI / budgetLimit) * 100) : 0;
  const daysLeft = 30 - new Date().getDate();
  const currentStreak = calculateStreak(allTransactions);
  const survivalScore = data.profile?.survival_score || 0;

  const catStats = data.allCategories?.filter((c: any) => c.type === 'expense').map((c: any) => {
    const amt = filteredStatsTransactions.filter((t: any) => t.category_id === c.id).reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    return { ...c, amount: amt, pct: totalSpentStats > 0 ? Math.round((amt / totalSpentStats) * 100) : 0 };
  }).filter((c: any) => c.amount > 0) || [];

  const getDailyData = () => {
    const now = new Date();
    const result: any[] = [];
    const categories = data.allCategories?.filter((c: any) => c.type === 'expense') || [];
    const days = locale === 'vi' ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    if (dailyPeriod === 'week') {
      const curr = new Date();
      const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1);
      const startOfWeek = new Date(curr.setDate(first));
      startOfWeek.setHours(0,0,0,0);
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayTrans = allTransactions.filter((t: any) => t.date.split('T')[0] === dateStr && t.type === 'expense');
        const dayTotal = dayTrans.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        const segments = categories.map((c: any) => ({ color: c.color, amount: dayTrans.filter((t: any) => t.category_id === c.id).reduce((sum: number, t: any) => sum + Number(t.amount), 0) })).filter((s: any) => s.amount > 0);
        result.push({ label: days[d.getDay()], total: dayTotal, segments, isToday: d.toDateString() === now.toDateString() });
      }
    } else {
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayTrans = allTransactions.filter((t: any) => t.date.split('T')[0] === dateStr && t.type === 'expense');
        const dayTotal = dayTrans.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        const segments = categories.map((c: any) => ({ color: c.color, amount: dayTrans.filter((t: any) => t.category_id === c.id).reduce((sum: number, t: any) => sum + Number(t.amount), 0) })).filter((s: any) => s.amount > 0);
        result.push({ label: d.getDate().toString(), total: dayTotal, segments, isToday: i === 0 });
      }
    }
    return result;
  };

  const dailyData = getDailyData();
  const avgSpend = Math.round(dailyData.reduce((sum, d) => sum + d.total, 0) / dailyData.length);
  const r = 68;
  const circ = 2 * Math.PI * r;

  const handleExport = () => {
    if (!allTransactions.length) return;
    const headers = locale === 'vi' ? ['Ngày', 'Danh mục', 'Số tiền', 'Loại', 'Ghi chú'] : ['Date', 'Category', 'Amount', 'Type', 'Note'];
    const rows = allTransactions.map((t: any) => [new Date(t.date).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US'), t.categories?.name || 'Other', t.amount, t.type, t.note || '']);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Report_T${new Date().getMonth() + 1}.csv`);
    link.click();
  };

  let cumulativePct = 0;
  const donutSegments = catStats.map((c: any) => {
    const segmentOffset = (cumulativePct / 100) * circ;
    cumulativePct += c.pct;
    return { ...c, offset: -segmentOffset, length: (c.pct / 100) * circ };
  });

  return (
    <div className="main-inner">
      <div className="page-head">
        <div>
          <h1>{t('nav.dashboard')}</h1>
          <p className="sub">Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()} · <b>{daysLeft} {t('dashboard.days_left')}</b> · {t('dashboard.used_budget')} <b>{pctSpent}%</b></p>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-outline btn-sm" onClick={handleExport}><Icon name="download" size={14} /><span>{t('dashboard.export_report')}</span></button>
          <button className="btn btn-primary" onClick={onAdd}><Icon name="plus" size={14} /><span>{t('dashboard.record_expense')}</span></button>
        </div>
      </div>

      <div className="kpi-row">
        <Kpi primary label={t('dashboard.remaining')} value={remainingBudget.toLocaleString()} unit="đ" delta={`${pctSpent}% used`} meta={`${budgetLimit.toLocaleString()}đ limit`} bar={Math.min(100, pctSpent)} onAction={onEditBudget} />
        <Kpi icon="arrow-right" label={t('dashboard.spent')} value={totalSpentKPI.toLocaleString()} unit="đ" delta="▲ 0%" deltaDir="down" meta="vs last month" />
        <Kpi icon="piggy" label={t('dashboard.savings')} value={savedValue.toLocaleString()} unit="đ" delta="▲ 0%" deltaDir="up" meta="over goal" />
        <Kpi icon="zap" label={t('dashboard.streak')} value={currentStreak} unit={` ${t('common.days')}`} delta={`🔥 Score: ${survivalScore}`} meta="Keeping records" />
      </div>

      <div className="roast" style={{ marginBottom: '24px' }}>
        <div className="roast-emo">🧋</div>
        <div className="roast-body">
          <div className="roast-label">{t('dashboard.roast_title')}</div>
          <div className="roast-text">
            {totalSpentKPI > budgetLimit * 0.8 && budgetLimit > 0
              ? (locale === 'vi' ? "Bạn sắp cháy túi rồi đấy! 🛑" : "You are about to burn out your wallet! 🛑")
              : (locale === 'vi' ? "Tình hình tài chính vẫn ổn. ☕️" : "Financial status is still okay. ☕️")}
          </div>
        </div>
      </div>

      <div className="dash-row r-1-1">
        <div className="card flush">
          <div className="card-h">
            <div>
              <h3>{t('dashboard.where_spent')}</h3>
              <div className="sub">{t('transactions.category')} breakdown</div>
            </div>
            <div className="seg">
              <button className={statsPeriod === 'month' ? 'active' : ''} onClick={() => setStatsPeriod('month')}>{locale === 'vi' ? 'Tháng này' : 'Month'}</button>
              <button className={statsPeriod === '3months' ? 'active' : ''} onClick={() => setStatsPeriod('3months')}>{locale === 'vi' ? '3 tháng' : '3M'}</button>
              <button className={statsPeriod === 'year' ? 'active' : ''} onClick={() => setStatsPeriod('year')}>{locale === 'vi' ? 'Năm' : 'Year'}</button>
            </div>
          </div>
          <div className="card-body" style={{ padding: '32px' }}>
            {catStats.length > 0 ? (
              <div className="donut-card" style={{ gridTemplateColumns: '120px 1fr', gap: '16px' }}>
                <div className="donut" style={{ width: '120px', height: '120px' }}>
                  <svg viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r={r} fill="none" stroke="var(--bg-2)" strokeWidth="14" />
                    {donutSegments.map((seg: any) => (
                      <circle key={seg.id} cx="80" cy="80" r={r} fill="none" stroke={seg.color || 'var(--purple-500)'} strokeWidth="14" strokeDasharray={`${seg.length} ${circ - seg.length}`} strokeDashoffset={seg.offset} transform="rotate(-90 80 80)" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                    ))}
                  </svg>
                  <div className="donut-center"><div className="v" style={{ fontSize: '15px' }}>{totalSpentStats >= 1000000 ? (totalSpentStats/1000000).toFixed(1) + 'M' : (totalSpentStats/1000).toLocaleString() + 'k'}</div></div>
                </div>
                <div className="legend">
                  {catStats.slice(0, 4).map((c: any) => (
                    <div key={c.id} className="legend-row" style={{ fontSize: '11px' }}>
                      <div className="sw" style={{ background: c.color || 'var(--purple-500)', width: '8px', height: '8px' }}></div>
                      <div className="nm">{c.name}</div>
                      <div className="am">{c.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div style={{ textAlign: 'center', color: 'var(--t3)', padding: '40px 0', fontSize: '12px' }}>No data.</div>}
          </div>
        </div>

        <div className="card flush">
          <div className="card-h">
            <div>
              <h3>{t('dashboard.daily_spent')}</h3>
              <div className="sub"><b>{avgSpend.toLocaleString()}đ</b> / day</div>
            </div>
            <div className="seg">
              <button className={dailyPeriod === 'week' ? 'active' : ''} onClick={() => setDailyPeriod('week')}>{locale === 'vi' ? 'Tuần' : 'Week'}</button>
              <button className={dailyPeriod === 'month' ? 'active' : ''} onClick={() => setDailyPeriod('month')}>{locale === 'vi' ? 'Tháng' : 'Month'}</button>
            </div>
          </div>
          <div className="card-body" style={{ padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px' }}>
              {dailyData.map((d, i) => {
                const maxDay = Math.max(...dailyData.map(x => x.total), 1);
                const heightPct = (d.total / maxDay) * 100;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', gap: '6px' }}>
                    <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column-reverse', borderRadius: '3px 3px 0 0', overflow: 'hidden', background: 'var(--bg-2)' }}>
                      {d.segments.map((s: any, si: number) => (
                        <div key={si} style={{ width: '100%', height: `${(s.amount / d.total) * 100}%`, background: s.color }} />
                      ))}
                      <div style={{ width: '100%', height: `${100 - heightPct}%` }} />
                    </div>
                    <div style={{ fontSize: '9px', textAlign: 'center', color: d.isToday ? 'var(--purple-700)' : 'var(--t3)', fontWeight: d.isToday ? 800 : 500 }}>{d.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="card flush">
        <div className="card-h">
          <div>
            <h3>{t('dashboard.recent')}</h3>
            <div className="sub">Your latest transactions</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onSeeAll}>{locale === 'vi' ? 'Xem tất cả' : 'See all'}</button>
        </div>
        <div className="card-body tight">
          <table className="tbl">
            <tbody>
              {allTransactions.slice(0, 8).map((t: any) => (
                <tr key={t.id}>
                  <td>
                    <div className="tx-cell">
                      <div className={`tx-cat-ico ${t.categories?.icon || 'other'}`} style={{ background: t.categories?.color ? `${t.categories.color}20` : undefined, color: t.categories?.color }}><Icon name={(t.categories?.icon as any) || 'list'} size={14} /></div>
                      <div>
                        <div className="tx-name">{t.note || t.categories?.name || 'Expense'}</div>
                        <div className="tx-note">{new Date(t.date).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge gray" style={{ background: t.categories?.color ? `${t.categories.color}20` : undefined, color: t.categories?.color }}>{t.categories?.name || 'Other'}</span></td>
                  <td className="num"><span className={t.type === 'expense' ? 'amt-spend' : 'amt-save'} style={{ fontWeight: 700, fontSize: '14px' }}>{t.type === 'expense' ? '-' : '+'}{Number(t.amount).toLocaleString()}đ</span></td>
                </tr>
              ))}
              {allTransactions.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t3)' }}>No transactions.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
