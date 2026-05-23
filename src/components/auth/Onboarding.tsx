'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { createMonthlyBudget, updateProfile } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ userId, onComplete }) => {
  const [amount, setAmount] = useState(5000000);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasExistingName, setHasExistingName] = useState(false);
  const presets = [3000000, 5000000, 8000000, 10000000];

  const supabase = createClient();

  useEffect(() => {
    async function getInitialData() {
      // 1. Check metadata
      const { data: { user } } = await supabase.auth.getUser();
      const metaName = user?.user_metadata?.display_name || user?.user_metadata?.full_name;
      
      // 2. Check profile table
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle();
      
      const finalName = profile?.display_name || metaName || user?.email?.split('@')[0] || '';
      setName(finalName);
      
      if (profile?.display_name || metaName) {
        setHasExistingName(true);
      }
    }
    getInitialData();
  }, [supabase, userId]);

  const fmt = (v: number) => v.toLocaleString();

  const handleStart = async () => {
    if (!name.trim()) {
      alert('Vui lòng nhập tên của bạn.');
      return;
    }

    setLoading(true);
    try {
      const budgetAmount = amount || 5000000;
      // 1. Create budget (which also creates profile if missing)
      await createMonthlyBudget(userId, budgetAmount);
      
      // 2. Update display name ONLY if it changed or was missing
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
        <h2>{hasExistingName ? `Chào ${name}!` : 'Chào mừng bạn đến với TieuGon'}</h2>
        <p className="lead">
          {hasExistingName 
            ? 'Hãy đặt mục tiêu ngân sách để app có thể... phán xét bạn hiệu quả hơn nhé 🙂' 
            : 'Hãy để lại cái tên để app có thể... phán xét bạn đích danh hơn nhé 🙂'}
        </p>

        {!hasExistingName && (
          <div className="field" style={{ marginTop: 28 }}>
            <label className="label">Tên của bạn</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Nhập tên..." 
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ fontSize: '16px', padding: '12px' }}
            />
          </div>
        )}

        <div className="field" style={{ marginTop: hasExistingName ? 28 : 20 }}>
          <label className="label">Ngân sách tháng này (VNĐ)</label>
          <div className="amount-input">
            <input
              type="text"
              value={amount ? fmt(amount) : ''}
              placeholder="0"
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setAmount(val ? parseInt(val, 10) : 0);
              }}
            />
            <span className="unit">đ</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '8px' }}>
            Gợi ý: 5tr = ~ 167k/ngày, đủ cho 1 bữa ăn + 1 ly trà sữa + 1 cuốc Grab 🥲
          </p>
        </div>

        <div style={{ marginTop: 24 }}>
          <div className="label" style={{ marginBottom: 12 }}>Hoặc chọn nhanh</div>
          <div className="onboard-presets">
            {presets.map(p => (
              <button key={p} className={'preset' + (amount === p ? ' active' : '')} onClick={() => setAmount(p)}>
                <span>{fmt(p)}đ</span>
                {amount === p && <Icon name="check" size={14} />}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 36, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={handleSkip} disabled={loading}>Bỏ qua</button>
          <button className="btn btn-primary btn-lg" onClick={handleStart} disabled={loading}>
            {loading ? 'Đang lưu...' : (
              <>
                <span>Bắt đầu tiết kiệm</span>
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
