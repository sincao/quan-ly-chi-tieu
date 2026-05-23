'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { createCampaign } from '@/lib/supabase/queries';

interface CreateCampaignModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ open, onClose, userId, onSuccess }) => {
  const [name, setName] = useState('');
  const [dailySavings, setDailySavings] = useState<number>(50000);
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('💰');
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    if (!name || dailySavings <= 0) {
      alert('Vui lòng nhập tên và số tiền tiết kiệm mỗi ngày.');
      return;
    }

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
        description: description || `Tiết kiệm ${dailySavings.toLocaleString()}đ mỗi ngày`
      });

      if (error) throw error;
      
      onSuccess();
      onClose();
      // Reset
      setName('');
      setDailySavings(50000);
      setDescription('');
    } catch (err) {
      console.error('Failed to create campaign:', err);
      alert('Không thể tạo nhóm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Tạo chiến dịch tiết kiệm mới</h3>
          <button className="close" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="field">
            <label className="label">Tên chiến dịch</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Ví dụ: Cai rượu" 
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label">Mục tiêu (Mô tả ngắn)</label>
            <textarea 
              className="input" 
              placeholder="Ví dụ: tiết kiệm tiền..." 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="field">
            <label className="label">Số tiền tiết kiệm mỗi ngày (VND)</label>
            <div className="amount-input">
              <input 
                type="text" 
                value={dailySavings ? dailySavings.toLocaleString() : ''} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setDailySavings(val ? parseInt(val, 10) : 0);
                }} 
                placeholder="50,000"
              />
              <span className="unit">đ/ngày</span>
            </div>
            <p className="help">Nếu không vi phạm, số tiền này sẽ tự cộng dồn mỗi ngày.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="field">
              <label className="label">Biểu tượng</label>
              <select className="select" value={emoji} onChange={e => setEmoji(e.target.value)}>
                <option value="💰">💰 Tiền</option>
                <option value="🧋">🧋 Trà sữa</option>
                <option value="🚶">🚶 Đi bộ</option>
                <option value="🎮">🎮 Game</option>
                <option value="✈️">✈️ Du lịch</option>
                <option value="🏠">🏠 Nhà cửa</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Thời hạn (ngày)</label>
              <input 
                type="number" 
                className="input" 
                value={days}
                onChange={e => setDays(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo chiến dịch ngay'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignModal;
