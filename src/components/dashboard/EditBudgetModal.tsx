'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { createMonthlyBudget } from '@/lib/supabase/queries';

interface EditBudgetModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentAmount: number;
  onSuccess: () => void;
}

const EditBudgetModal: React.FC<EditBudgetModalProps> = ({ open, onClose, userId, currentAmount, onSuccess }) => {
  const [amount, setAmount] = useState(currentAmount || 5000000);
  const [loading, setLoading] = useState(false);
  const presets = [3000000, 5000000, 8000000, 10000000];

  useEffect(() => {
    if (open) setAmount(currentAmount || 5000000);
  }, [open, currentAmount]);

  if (!open) return null;

  const fmt = (v: number) => v.toLocaleString();

  const handleSave = async () => {
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
          <h3>Chỉnh sửa ngân sách</h3>
          <button className="close" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          <p style={{ fontSize: '13px', color: 'var(--t2)', marginBottom: '20px' }}>
            Thiết lập hạn mức chi tiêu để app có thể phán xét bạn chính xác hơn 🙂
          </p>

          <div className="field">
            <label className="label">Ngân sách tháng này</label>
            <div className="amount-input">
              <input
                type="text"
                value={amount ? fmt(amount) : ''}
                placeholder="0"
                autoFocus
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setAmount(val ? parseInt(val, 10) : 0);
                }}
              />
              <span className="unit">đ</span>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div className="label" style={{ marginBottom: 10 }}>Chọn nhanh</div>
            <div className="onboard-presets" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {presets.map(p => (
                <button 
                  key={p} 
                  className={'preset' + (amount === p ? ' active' : '')} 
                  onClick={() => setAmount(p)}
                  style={{ padding: '12px' }}
                >
                  <span>{fmt(p)}đ</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Đang lưu...' : 'Cập nhật ngân sách'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBudgetModal;
