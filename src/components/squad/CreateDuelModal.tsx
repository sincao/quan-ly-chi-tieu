'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase/client';
import { getSquadData, getFriendships, getAllProfiles } from '@/lib/supabase/queries';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface CreateDuelModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

const CreateDuelModal: React.FC<CreateDuelModalProps> = ({ open, onClose, userId, onSuccess }) => {
  const { t } = useLanguage();

  const DUEL_TEMPLATES = [
    { id: 'campaign_savings', label: t('duel.t1_label'), desc: t('duel.t1_desc'), defaultStake: t('duel.t1_stake') },
    { id: 'campaign_violations', label: t('duel.t2_label'), desc: t('duel.t2_desc'), defaultStake: t('duel.t2_stake') },
    { id: 'campaign_streaks', label: t('duel.t3_label'), desc: t('duel.t3_desc'), defaultStake: t('duel.t3_stake') },
  ];

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [availableOpponents, setAvailableOpponents] = useState<any[]>([]);
  const [opponentId, setOpponentId] = useState('');
  const [type, setType] = useState('campaign_savings');
  const [stake, setStake] = useState('');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const supabase = createClient();

  const loadInitialData = async () => {
    setInitialLoading(true);
    try {
      const squad = await getSquadData(userId);
      const joined = squad.campaigns.filter((c: any) => c.isJoined);
      setCampaigns(joined);
      if (joined.length > 0) setSelectedCampaignId(joined[0].id);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (open) { loadInitialData(); setErrors({}); }
  }, [open, userId]);

  const updateOpponents = async (campId: string) => {
    try {
      const camp = campaigns.find(c => c.id === campId);
      if (!camp) return;

      const { data: friends } = await getFriendships(userId);
      const friendIds = friends?.map((f: any) => f.user_id === userId ? f.friend_id : f.user_id) || [];

      const { profiles: allProfs } = await getAllProfiles();
      const membersInCamp = camp.members?.map((m: any) => m.user_id) || [];

      const filtered = (allProfs || []).filter((p: any) =>
        p.id !== userId &&
        membersInCamp.includes(p.id) &&
        friendIds.includes(p.id)
      );

      setAvailableOpponents(filtered);
      if (filtered.length > 0) setOpponentId(filtered[0].id);
      else setOpponentId('');
    } catch (err) {
      console.error('Failed to update opponents:', err);
    }
  };

  useEffect(() => {
    if (selectedCampaignId) updateOpponents(selectedCampaignId);
  }, [selectedCampaignId]);

  useEffect(() => {
    const template = DUEL_TEMPLATES.find(tmpl => tmpl.id === type);
    if (template) setStake(template.defaultStake);
  }, [type]);

  if (!open) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedCampaignId) e.campaign = t('validation.campaign_required');
    if (!opponentId) e.opponent = t('validation.opponent_required');
    if (!days || days < 1) e.days = t('validation.days_min');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const template = DUEL_TEMPLATES.find(tmpl => tmpl.id === type);
      const camp = campaigns.find(c => c.id === selectedCampaignId);

      const { error } = await supabase
        .from('duels')
        .insert([{
          title: `${template?.label}: ${camp?.name}`,
          challenge_type: type,
          campaign_id: selectedCampaignId,
          creator_id: userId,
          opponent_id: opponentId,
          stake,
          end_date: endDate.toISOString(),
          status: 'active'
        }]);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create duel:', err);
      alert(t('duel.error_create'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scrim" onClick={onClose} style={{ zIndex: 300 }}>
      <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{t('duel.modal_title')}</h3>
          <button className="close" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Icon name="info" size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ color: 'var(--t2)', fontWeight: 600 }}>{t('duel.no_campaign')}</p>
              <p style={{ fontSize: '13px', color: 'var(--t3)', marginTop: '4px' }}>{t('duel.no_campaign_sub')}</p>
            </div>
          ) : (
            <>
              <div className="field">
                <label className="label">{t('duel.select_campaign')}</label>
                <select
                  className={`select${errors.campaign ? ' error' : ''}`}
                  value={selectedCampaignId}
                  onChange={e => { setSelectedCampaignId(e.target.value); if (errors.campaign) setErrors(prev => ({ ...prev, campaign: '' })); }}
                >
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
                {errors.campaign
                  ? <span className="field-error">⚠ {errors.campaign}</span>
                  : <p className="help">{t('duel.campaign_help')}</p>
                }
              </div>

              <div className="field">
                <label className="label">{t('duel.select_opponent')}</label>
                {availableOpponents.length > 0 ? (
                  <select
                    className={`select${errors.opponent ? ' error' : ''}`}
                    value={opponentId}
                    onChange={e => { setOpponentId(e.target.value); if (errors.opponent) setErrors(prev => ({ ...prev, opponent: '' })); }}
                  >
                    {availableOpponents.map(p => (
                      <option key={p.id} value={p.id}>{p.display_name} ({p.tieugon_id})</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ padding: '12px', background: 'var(--bg-2)', borderRadius: '8px', border: `1px solid ${errors.opponent ? 'var(--rose)' : 'var(--line-2)'}`, color: 'var(--rose)', fontSize: '13px' }}>
                    {t('duel.no_opponents')}
                  </div>
                )}
                {errors.opponent && <span className="field-error">⚠ {errors.opponent}</span>}
              </div>

              <div className="field">
                <label className="label">{t('duel.format')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {DUEL_TEMPLATES.map(tmpl => (
                    <button
                      key={tmpl.id}
                      className={`chip ${type === tmpl.id ? 'active' : ''}`}
                      onClick={() => setType(tmpl.id)}
                      style={{ padding: '12px 8px', height: 'auto', whiteSpace: 'normal', textAlign: 'center', lineHeight: '1.2' }}
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
                <p className="help" style={{ marginTop: '8px' }}>{DUEL_TEMPLATES.find(tmpl => tmpl.id === type)?.desc}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="field">
                  <label className="label">{t('duel.stake')}</label>
                  <input type="text" className="input" value={stake} onChange={e => setStake(e.target.value)} placeholder={t('duel.stake_placeholder')} />
                </div>
                <div className="field">
                  <label className="label">{t('duel.duration')}</label>
                  <input
                    type="number"
                    className={`input${errors.days ? ' error' : ''}`}
                    value={days}
                    min={1}
                    placeholder="7"
                    onChange={e => { setDays(parseInt(e.target.value, 10) || 0); if (errors.days) setErrors(prev => ({ ...prev, days: '' })); }}
                  />
                  {errors.days && <span className="field-error">⚠ {errors.days}</span>}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading || campaigns.length === 0 || availableOpponents.length === 0}
          >
            {loading ? t('duel.creating') : t('duel.send')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDuelModal;
