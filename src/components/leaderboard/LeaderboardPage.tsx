'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase/client';
import { getDetailedLeaderboard } from '@/lib/supabase/queries';
import CreateDuelModal from '@/components/squad/CreateDuelModal';
import { useLanguage } from '@/components/providers/LanguageProvider';

const LeaderboardPage: React.FC = () => {
  const { t, locale } = useLanguage();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isDuelOpen, setDuelOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  
  const [metric, setMetric] = useState<'savings' | 'streak' | 'win_rate'>('savings');

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const { data: lb } = await getDetailedLeaderboard(session.user.id);
        if (lb) setData(lb);
      }
      setLoading(false);
    }
    load();
  }, []);

  const getInitials = (p: any) => {
    if (!p) return '??';
    if (p.last_name && p.first_name) return (p.last_name[0] + p.first_name[0]).toUpperCase();
    if (p.display_name) {
      const parts = p.display_name.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
      return p.display_name.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  const sortedData = [...data].sort((a, b) => {
    if (metric === 'savings') return b.monthly_savings - a.monthly_savings;
    if (metric === 'streak') return (b.current_streak || 0) - (a.current_streak || 0);
    return (b.win_rate || 0) - (a.win_rate || 0);
  });

  const filtered = sortedData.filter(p => 
    p.display_name?.toLowerCase().includes(search.toLowerCase()) || 
    p.tieugon_id?.toLowerCase().includes(search.toLowerCase())
  );

  const top1 = sortedData[0];
  const top2 = sortedData[1];
  const top3 = sortedData[2];

  const myRank = sortedData.findIndex(p => p.isMe) + 1;
  const top3Savings = sortedData[2]?.monthly_savings || 0;
  const mySavings = sortedData.find(p => p.isMe)?.monthly_savings || 0;
  const distanceToTop3 = Math.max(0, top3Savings - mySavings);
  const bobaCups = Math.ceil(distanceToTop3 / 50000);

  const getDisplayValue = (p: any) => {
    if (metric === 'savings') return Number(p.monthly_savings || 0).toLocaleString() + 'đ';
    if (metric === 'streak') return (p.current_streak || 0) + ` ${t('common.days')}`;
    return (p.win_rate || 0) + '%';
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('common.loading')}</div>;

  return (
    <div className="main-inner">
      <div className="page-head">
        <div>
          <h1>{t('leaderboard.title')}</h1>
          <p className="sub">
            {data.length} {t('leaderboard.people_participating')} • {t('leaderboard.current_rank_prefix')} <strong style={{ color: 'var(--purple-700)' }}>#{myRank > 0 ? myRank : '--'}</strong> • {t('leaderboard.month_rank')} {(new Date().getMonth() + 1)}/{new Date().getFullYear()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="seg">
            <button 
              className={metric === 'streak' ? 'active' : ''} 
              onClick={() => setMetric('streak')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              🔥 <span>Streak</span>
            </button>
            <button 
              className={metric === 'savings' ? 'active' : ''} 
              onClick={() => setMetric('savings')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
               <span>💰 {t('nav.dashboard') === 'Overview' ? 'Savings' : 'Tiết kiệm'}</span>
            </button>
            <button 
              className={metric === 'win_rate' ? 'active' : ''} 
              onClick={() => setMetric('win_rate')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
               <span>⚔ Win rate</span>
            </button>
          </div>
        </div>
      </div>

      <div className="card podium-card" style={{ marginBottom: '24px', padding: '32px 0 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800 }}>{t('leaderboard.podium_title')} • {metric === 'savings' ? (t('nav.dashboard') === 'Overview' ? 'Savings' : 'Tiết kiệm') : metric === 'streak' ? 'Streak' : 'Win rate'}</h3>
          <p style={{ fontSize: '11px', color: 'var(--t3)' }}>{t('leaderboard.month_rank')} {(new Date().getMonth() + 1)}/{new Date().getFullYear()}</p>
        </div>

        <div className="podium">
          <div className="podium-col" style={{ visibility: top2 ? 'visible' : 'hidden' }}>
            <div className="medal">{getInitials(top2)}<div style={{ position: 'absolute', top: '-8px', fontSize: '14px' }}>🥈</div></div>
            <div className="nm">{top2?.display_name || '---'}</div>
            <div className="podium-bar silver"><div className="rk">#2</div><div className="v">{top2 ? getDisplayValue(top2) : '---'}</div></div>
          </div>
          <div className="podium-col" style={{ visibility: top1 ? 'visible' : 'hidden' }}>
            <div className="medal gold">{getInitials(top1)}<div className="crown">👑</div></div>
            <div className="nm">{top1?.display_name || '---'}</div>
            <div className="podium-bar gold"><div className="rk">#1</div><div className="v">{top1 ? getDisplayValue(top1) : '---'}</div></div>
          </div>
          <div className="podium-col" style={{ visibility: top3 ? 'visible' : 'hidden' }}>
            <div className="medal">{getInitials(top3)}<div style={{ position: 'absolute', top: '-8px', fontSize: '14px' }}>🥉</div></div>
            <div className="nm">{top3?.display_name || '---'}</div>
            <div className="podium-bar bronze"><div className="rk">#3</div><div className="v">{top3 ? getDisplayValue(top3) : '---'}</div></div>
          </div>
        </div>
      </div>

      <div className="card flush" style={{ overflow: 'hidden' }}>
        <div className="card-h" style={{ padding: '20px 24px', borderBottom: '1px solid var(--line-2)' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800 }}>{t('leaderboard.full_rank')}</h2>
            <p className="sub" style={{ fontSize: '11px' }}>{t('leaderboard.sort_by')} {metric === 'savings' ? (t('nav.dashboard') === 'Overview' ? 'savings' : 'tiết kiệm') : metric === 'streak' ? 'streak' : 'win rate'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: '10px', padding: '0 12px', width: '260px' }}>
            <Icon name="search" size={16} style={{ color: 'var(--t3)' }} />
            <input type="text" placeholder={t('leaderboard.search_user')} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: '10px 0', background: 'transparent', border: 0, outline: 0, fontSize: '14px' }} />
          </div>
        </div>

        <table className="tbl lb-tbl">
          <thead>
            <tr style={{ background: 'var(--bg-2)' }}>
              <th style={{ paddingLeft: '24px', fontSize: '10px', color: 'var(--t3)', fontWeight: 700 }}>{t('leaderboard.rank')}</th>
              <th style={{ fontSize: '10px', color: 'var(--t3)', fontWeight: 700 }}>{t('leaderboard.user')}</th>
              <th style={{ fontSize: '10px', color: 'var(--t3)', fontWeight: 700 }}>{t('leaderboard.streak')}</th>
              <th style={{ background: metric === 'savings' ? 'rgba(124, 77, 255, 0.05)' : undefined, color: metric === 'savings' ? 'var(--purple-700)' : 'var(--t3)', fontSize: '10px', fontWeight: 800, textAlign: 'center' }}>
                {t('leaderboard.savings')} {metric === 'savings' ? '↓' : ''}
              </th>
              <th style={{ background: metric === 'win_rate' ? 'rgba(124, 77, 255, 0.05)' : undefined, color: metric === 'win_rate' ? 'var(--purple-700)' : 'var(--t3)', fontSize: '10px', fontWeight: 700, textAlign: 'center' }}>
                {t('leaderboard.winrate')} {metric === 'win_rate' ? '↓' : ''}
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const rank = sortedData.findIndex(x => x.id === p.id) + 1;
              const rankColor = rank === 1 ? '#D97706' : rank === 2 ? '#64748B' : rank === 3 ? '#92400E' : 'var(--t3)';
              return (
                <tr key={p.id}>
                  <td style={{ paddingLeft: '24px', fontWeight: 800, color: rankColor }}>#{rank}</td>
                  <td>
                    <div className="tx-cell">
                      <div className="avatar sm" style={{ background: p.isMe ? '#6938E8' : 'var(--purple-500)', color: '#fff', fontSize: '10px', fontWeight: 800, border: p.isMe ? '2px solid var(--purple-200)' : 'none' }}>{getInitials(p)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px' }}>{p.display_name || 'Anonymous'}</span>
                        {p.isMe && <span className="badge purple" style={{ fontSize: '8px', padding: '1px 3px' }}>{t('common.you')}</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '12px' }}>🔥 {p.current_streak || 0} {t('common.days')}</td>
                  <td style={{ background: metric === 'savings' ? 'rgba(124, 77, 255, 0.03)' : undefined, textAlign: 'center', fontWeight: 800, color: 'var(--purple-700)', fontSize: '14px' }}>{Number(p.monthly_savings || 0).toLocaleString()}đ</td>
                  <td style={{ background: metric === 'win_rate' ? 'rgba(124, 77, 255, 0.03)' : undefined, textAlign: 'center', fontWeight: 600, color: 'var(--t2)', fontSize: '12px' }}>{p.win_rate}%</td>
                  <td style={{ paddingRight: '20px', textAlign: 'right' }}>
                    {!p.isMe && <button className="btn-link" style={{ color: 'var(--t3)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }} onClick={() => { setTargetId(p.id); setDuelOpen(true); }}><Icon name="zap" size={12} /><span>{t('squad.challenge')}</span></button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {myRank > 0 && distanceToTop3 > 0 && (
        <div style={{ marginTop: '24px', background: '#FEF9C3', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #FEF08A' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}><Icon name="target" size={24} style={{ color: '#D97706' }} /></div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#92400E', letterSpacing: '0.05em', marginBottom: '2px' }}>{locale === 'vi' ? 'ĐỂ LEO HẠNG' : 'LEVEL UP'}</div>
            <p style={{ color: '#78350F', fontSize: '14px', fontWeight: 500 }}>{t('leaderboard.motivation')} <strong style={{ fontWeight: 800 }}>{distanceToTop3.toLocaleString()}đ</strong> tiết kiệm — {locale === 'vi' ? 'tức là nhịn khoảng' : 'approx.'} <strong style={{ fontWeight: 800 }}>{bobaCups} {t('leaderboard.boba')}</strong>. {locale === 'vi' ? 'Làm được mà' : 'You got this'} 🤘</p>
          </div>
        </div>
      )}
      {userId && <CreateDuelModal open={isDuelOpen} onClose={() => setDuelOpen(false)} userId={userId} onSuccess={() => {}} />}
    </div>
  );
};

export default LeaderboardPage;
