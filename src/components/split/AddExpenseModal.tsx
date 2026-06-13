'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { addTripExpense } from '@/lib/supabase/queries';

interface Member {
  id: string;
  nickname: string;
  profiles?: { display_name?: string };
}

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  tripId: string;
  members: Member[];
  onSuccess: () => void;
}

const CATEGORIES = ['Ăn uống', 'Di chuyển', 'Lưu trú', 'Vui chơi', 'Mua sắm', 'Khác'];

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ open, onClose, tripId, members, onSuccess }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [category, setCategory] = useState('Ăn uống');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setAmount('');
      setPayerId(members[0]?.id || '');
      setCategory('Ăn uống');
      setDate('');
      setError('');
    }
  }, [open, members]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Nhập tên khoản chi nhen!'); return; }
    const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!parsedAmount || parsedAmount <= 0) { setError('Nhập số tiền hợp lệ nhen!'); return; }
    if (!payerId) { setError('Chọn người đã trả nhen!'); return; }

    setLoading(true);
    setError('');
    try {
      const { error: err } = await addTripExpense({
        trip_id: tripId,
        payer_id: payerId,
        name: name.trim(),
        amount: parsedAmount,
        category,
        date: date.trim() || undefined,
      });
      if (err) throw err;
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Có lỗi rồi, thử lại nhen!');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    borderRadius: '10px',
    border: '1.5px solid #F0F0F3',
    padding: '10px 14px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
  };

  return (
    <div className="scrim" onClick={onClose} style={{ zIndex: 500 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-head">
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Thêm khoản chi</h3>
          <button className="close" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>

        <div className="modal-body" style={{ padding: '24px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Tên khoản chi</label>
              <input
                type="text"
                placeholder="VD: Ăn bún bò, Tiền xăng..."
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                style={inputStyle}
                autoFocus
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Số tiền (đ)</label>
              <input
                type="number"
                placeholder="VD: 150000"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); }}
                style={inputStyle}
                min={0}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Người đã trả</label>
              <select
                value={payerId}
                onChange={e => setPayerId(e.target.value)}
                style={{ ...inputStyle, background: '#fff' }}
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.profiles?.display_name || m.nickname}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Hạng mục</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ ...inputStyle, background: '#fff' }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Ngày <span style={{ fontWeight: 400, color: 'var(--t3)' }}>(tuỳ chọn)</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: 27/06"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div style={{ minHeight: '20px', marginTop: '8px' }}>
            {error && <p style={{ color: 'var(--rose)', fontSize: '12px', margin: 0 }}>{error}</p>}
          </div>
        </div>

        <div className="modal-foot" style={{ padding: '16px 24px', borderTop: '1px solid #F0F0F3', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ borderRadius: '10px', padding: '10px 20px', fontWeight: 700 }}>Huỷ</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              borderRadius: '10px',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #7C4DFF 0%, #6938E8 100%)',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            {loading ? 'Đang lưu...' : (
              <>
                <Icon name="check" size={16} />
                <span>Lưu khoản chi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;
