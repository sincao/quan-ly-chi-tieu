'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { createCampaign } from '@/lib/supabase/queries';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface CreateCampaignModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ open, onClose, userId, onSuccess }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [dailySavings, setDailySavings] = useState<number>(50000);
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('💰');
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const clearError = (field: string) => {
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t('validation.required');
    if (!dailySavings || dailySavings <= 0) e.dailySavings = t('validation.amount_positive');
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

      const { error } = await createCampaign({
        name,
        daily_savings: dailySavings,
        emoji,
        end_date: endDate.toISOString(),
        creator_id: userId,
        description: description || `${dailySavings.toLocaleString()}đ`
      });

      if (error) throw error;

      onSuccess();
      onClose();
      setName('');
      setDailySavings(50000);
      setDescription('');
      setErrors({});
    } catch (err) {
      console.error('Failed to create campaign:', err);
      alert(t('campaign.error_create'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{t('campaign.modal_title')}</h3>
          <button className="close" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="field">
            <label className="label">{t('campaign.name_label')}</label>
            <input
              type="text"
              className={`input${errors.name ? ' error' : ''}`}
              placeholder={t('campaign.name_placeholder')}
              value={name}
              onChange={e => { setName(e.target.value); clearError('name'); }}
            />
            {errors.name && <span className="field-error">⚠ {errors.name}</span>}
          </div>

          <div className="field">
            <label className="label">{t('campaign.goal_label')}</label>
            <textarea
              className="input"
              placeholder={t('campaign.goal_placeholder')}
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="field">
            <label className="label">{t('campaign.daily_label')}</label>
            <div className={`amount-input${errors.dailySavings ? ' error' : ''}`}>
              <input
                type="text"
                value={dailySavings ? dailySavings.toLocaleString() : ''}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setDailySavings(val ? parseInt(val, 10) : 0);
                  clearError('dailySavings');
                }}
                placeholder="50,000"
              />
              <span className="unit">{t('campaign.daily_unit')}</span>
            </div>
            {errors.dailySavings
              ? <span className="field-error">⚠ {errors.dailySavings}</span>
              : <p className="help">{t('campaign.daily_help')}</p>
            }
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="field">
              <label className="label">{t('campaign.emoji_label')}</label>
              <select className="select" value={emoji} onChange={e => setEmoji(e.target.value)}>
                <option value="💰">💰 {t('campaign.emoji_money')}</option>
                <option value="🧋">🧋 {t('campaign.emoji_boba')}</option>
                <option value="🚶">🚶 {t('campaign.emoji_walk')}</option>
                <option value="🎮">🎮 {t('campaign.emoji_game')}</option>
                <option value="✈️">✈️ {t('campaign.emoji_travel')}</option>
                <option value="🏠">🏠 {t('campaign.emoji_home')}</option>
              </select>
            </div>
            <div className="field">
              <label className="label">{t('campaign.duration_label')}</label>
              <input
                type="number"
                className={`input${errors.days ? ' error' : ''}`}
                value={days}
                min={1}
                placeholder="30"
                onChange={e => { setDays(parseInt(e.target.value, 10) || 0); clearError('days'); }}
              />
              {errors.days && <span className="field-error">⚠ {errors.days}</span>}
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? t('campaign.creating') : t('campaign.create_btn')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignModal;
