'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { createMonthlyBudget, updateProfile } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ userId, onComplete }) => {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(5000000);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasExistingName, setHasExistingName] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const presets = [3000000, 5000000, 8000000, 10000000];

  const supabase = createClient();

  useEffect(() => {
    async function getInitialData() {
      const { data: { user } } = await supabase.auth.getUser();
      const metaName = user?.user_metadata?.display_name || user?.user_metadata?.full_name;
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle();
      const finalName = profile?.display_name || metaName || user?.email?.split('@')[0] || '';
      setName(finalName);
      if (profile?.display_name || metaName) setHasExistingName(true);
    }
    getInitialData();
  }, [supabase, userId]);

  const fmt = (v: number) => v.toLocaleString();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!hasExistingName && !name.trim()) e.name = t('validation.required');
    if (!amount || amount <= 0) e.amount = t('validation.amount_budget');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStart = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const budgetAmount = amount || 5000000;
      await createMonthlyBudget(userId, budgetAmount);
      if (!hasExistingName || name !== '') {
        await updateProfile(userId, { display_name: name });
      }
    } catch (err) {
      console.warn('Silent fail on onboarding save:', err);
    } finally {
      localStorage.setItem(`onboarding_${userId}`, 'true');
      setLoading(false);
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem(`onboarding_${userId}`, 'true');
    onComplete();
  };

  return (
    <div className="onboard-shell">
      <div className="onboard">
        <div className="onboard-mark">$</div>
        <h2>{hasExistingName ? `${t('onboarding.greeting_prefix')} ${name}!` : t('onboarding.welcome')}</h2>
        <p className="lead">
          {hasExistingName ? t('onboarding.subtitle_with_name') : t('onboarding.subtitle_no_name')}
        </p>

        {!hasExistingName && (
          <div className="field" style={{ marginTop: 28 }}>
            <label className="label">{t('onboarding.name_label')}</label>
            <input
              type="text"
              className={`input${errors.name ? ' error' : ''}`}
              placeholder={t('onboarding.name_placeholder')}
              value={name}
              onChange={e => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: '' })); }}
              style={{ fontSize: '16px', padding: '12px' }}
            />
            {errors.name && <span className="field-error">⚠ {errors.name}</span>}
          </div>
        )}

        <div className="field" style={{ marginTop: hasExistingName ? 28 : 20 }}>
          <label className="label">{t('onboarding.budget_label')}</label>
          <div className={`amount-input${errors.amount ? ' error' : ''}`}>
            <input
              type="text"
              value={amount ? fmt(amount) : ''}
              placeholder="0"
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setAmount(val ? parseInt(val, 10) : 0);
                if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
              }}
            />
            <span className="unit">đ</span>
          </div>
          {errors.amount
            ? <span className="field-error">⚠ {errors.amount}</span>
            : <p style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '4px' }}>{t('onboarding.budget_hint')}</p>
          }
        </div>

        <div style={{ marginTop: 24 }}>
          <div className="label" style={{ marginBottom: 12 }}>{t('onboarding.quick_select')}</div>
          <div className="onboard-presets">
            {presets.map(p => (
              <button key={p} className={'preset' + (amount === p ? ' active' : '')} onClick={() => { setAmount(p); if (errors.amount) setErrors(prev => ({ ...prev, amount: '' })); }}>
                <span>{fmt(p)}đ</span>
                {amount === p && <Icon name="check" size={14} />}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 36, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={handleSkip} disabled={loading}>{t('onboarding.skip')}</button>
          <button className="btn btn-primary btn-lg" onClick={handleStart} disabled={loading}>
            {loading ? t('common.saving') : (
              <>
                <span>{t('onboarding.start')}</span>
                <Icon name="arrow-right" size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
