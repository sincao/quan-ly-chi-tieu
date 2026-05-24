'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import UserAvatar from '@/components/ui/UserAvatar';
import { getCampaignMembers } from '@/lib/supabase/queries';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface CampaignDetailProps {
  campaign: any;
  currentUserId: string;
  onBack: () => void;
}

const CampaignDetail: React.FC<CampaignDetailProps> = ({ campaign, currentUserId, onBack }) => {
  const { t } = useLanguage();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await getCampaignMembers(campaign.id);
      if (data) setMembers(data);
      setLoading(false);
    }
    load();
  }, [campaign.id]);


  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('campaign_detail.loading')}</div>;

  const totalMembers = members.length;
  const holdingSteady = Math.ceil(totalMembers * 0.8);
  const violated = totalMembers - holdingSteady;

  return (
    <div className="card flush">
      <div style={{ padding: '24px' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: '16px', marginLeft: '-8px' }}>
          <Icon name="arrow-left" size={14} />
          <span>{t('common.back')}</span>
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>{campaign.emoji}</span>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{campaign.name}</h2>
            </div>
            <p className="sub" style={{ marginTop: '4px', color: 'var(--t3)' }}>{campaign.description}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge purple" style={{ padding: '6px 12px', borderRadius: '8px' }}>{campaign.daysLeft} {t('campaign_detail.days_left')}</span>
            <button className="icon-btn sm"><Icon name="more-horizontal" size={16} /></button>
          </div>
        </div>

        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--t2)', fontWeight: 600 }}>{t('campaign_detail.group_progress')}</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--purple-700)' }}>{Math.round((campaign.current / campaign.target) * 100)}%</span>
          </div>
          <div className="bar" style={{ height: '8px' }}><i style={{ width: `${Math.min(100, (campaign.current / campaign.target) * 100)}%` }}></i></div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '13px' }}>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>{holdingSteady} {t('campaign_detail.holding')}</span>
            <span style={{ color: 'var(--rose)', fontWeight: 600 }}>{violated} {t('campaign_detail.violated')}</span>
          </div>
        </div>
      </div>

      <table className="tbl" style={{ marginTop: '16px' }}>
        <thead>
          <tr>
            <th style={{ paddingLeft: '24px' }}>{t('campaign_detail.col_member')}</th>
            <th>{t('campaign_detail.col_status')}</th>
            <th className="num" style={{ paddingRight: '24px' }}>{t('campaign_detail.col_saved')}</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m: any, i: number) => {
            const isMe = m.user_id === currentUserId;
            const isViolated = i === 3;
            return (
              <tr key={m.user_id}>
                <td style={{ paddingLeft: '24px' }}>
                  <div className="tx-cell">
                    <UserAvatar profile={m.profiles} className="avatar sm" style={{ background: isMe ? undefined : 'var(--purple-200)', color: isMe ? undefined : 'var(--purple-700)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="tx-name" style={{ fontSize: '14px', fontWeight: 700 }}>{m.profiles?.display_name || t('campaign_detail.member_fallback')}</span>
                      {isMe && <span className="badge purple" style={{ fontSize: '10px' }}>{t('common.you')}</span>}
                    </div>
                  </div>
                </td>
                <td>
                  {isViolated ? (
                    <span className="badge rose" style={{ borderRadius: '6px', padding: '4px 10px' }}>
                      {t('campaign_detail.status_violated')}
                    </span>
                  ) : (
                    <span className="badge green" style={{ borderRadius: '6px', padding: '4px 10px', background: '#ECFDF5', color: '#059669' }}>
                      {t('campaign_detail.status_ok')}
                    </span>
                  )}
                </td>
                <td className="num" style={{ paddingRight: '24px', fontWeight: 700, color: isViolated ? 'var(--t4)' : 'var(--green)' }}>
                  {isViolated ? '—' : `+${(145000 + i * 1000).toLocaleString()}đ`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CampaignDetail;
