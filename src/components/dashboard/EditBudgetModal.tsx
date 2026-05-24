'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { createMonthlyBudget } from '@/lib/supabase/queries';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface EditBudgetModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentAmount: number;
  onSuccess: () => void;
}

const EditBudgetModal: React.FC<EditBudgetModalProps> = ({ open, onClose, userId, currentAmount, onSuccess }) => {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(currentAmount || 5000000);
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState('');
  const presets = [3000000, 5000000, 8000000, 10000000];

  useEffect(() => {
    if (open) { setAmount(currentAmount || 5000000); setAmountError(''); }
  }, [open, currentAmount]);

  if (!open) return null;

  const fmt = (v: number) => v.toLocaleString();

  const handleSave = async () => {
    if (!amount || amount <= 0) { setAmountError(t('validation.amount_budget')); return; }
    setLoading(true);
    try {
      await createMonthlyBudget(userId, amount);
    } catch (err) {
      console.warn('Silent fail on budget update:', err);
    } finally {
      setLoading(false);
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{t('budget.edit_title')}</h3>
          <button className="close" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          <p style={{ fontSize: '13px', color: 'var(--t2)', marginBottom: '20px' }}>
            {t('budget.edit_desc')}
          </p>

          <div className="field">
            <label className="label">{t('budget.month_label')}</label>
            <div className={`amount-input${amountError ? ' error' : ''}`}>
              <input
                type="text"
                value={amount ? fmt(amount) : ''}
                placeholder="0"
                autoFocus
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setAmount(val ? parseInt(val, 10) : 0);
                  if (amountError) setAmountError('');
                }}
              />
              <span className="unit">đ</span>
            </div>
            {amountError && <span className="field-error">⚠ {amountError}</span>}
          </div>

          <div style={{ marginTop: 20 }}>
            <div className="label" style={{ marginBottom: 10 }}>{t('budget.quick_select')}</div>
            <div className="onboard-presets" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {presets.map(p => (
                <button
                  key={p}
                  className={'preset' + (amount === p ? ' active' : '')}
                  onClick={() => { setAmount(p); setAmountError(''); }}
                  style={{ padding: '12px' }}
                >
                  <span>{fmt(p)}đ</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? t('common.saving') : t('budget.update')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBudgetModal;
