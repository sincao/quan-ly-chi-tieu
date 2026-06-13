'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { addRestaurant, updateRestaurant } from '@/lib/supabase/queries';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface AddRestaurantModalProps {
  open: boolean;
  onClose: () => void;
  dishId: string;
  onSuccess: () => void;
  editRes?: any;
}

const AddRestaurantModal: React.FC<AddRestaurantModalProps> = ({ open, onClose, dishId, onSuccess, editRes }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (editRes) {
        setName(editRes.name);
        setAddress(editRes.address || '');
        setVideoLink(editRes.video_link || '');
        setReview(editRes.review || '');
      } else {
        setName('');
        setAddress('');
        setVideoLink('');
        setReview('');
      }
      setError('');
    }
  }, [open, editRes]);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t('validation.required'));
      return;
    }
    setLoading(true);
    try {
      if (editRes) {
        await updateRestaurant(editRes.id, { name, address, video_link: videoLink, review });
      } else {
        await addRestaurant({ dish_id: dishId, name, address, video_link: videoLink, review });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scrim" onClick={onClose} style={{ zIndex: 400 }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{editRes ? t('common.edit') : 'Thêm địa điểm ăn'}</h3>
          <button className="close" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="field" style={{ marginBottom: '16px' }}>
            <label className="label">Tên quán</label>
            <input
              type="text"
              className={`input ${error ? 'error' : ''}`}
              placeholder="Ví dụ: Phở Thìn Lò Đúc..."
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              autoFocus
            />
            {error && <span style={{ color: 'var(--rose)', fontSize: '12px', marginTop: '4px' }}>{error}</span>}
          </div>

          <div className="field" style={{ marginBottom: '16px' }}>
            <label className="label">Địa chỉ</label>
            <input
              type="text"
              className="input"
              placeholder="Nhập địa chỉ hoặc khu vực..."
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          <div className="field" style={{ marginBottom: '16px' }}>
            <label className="label">Link video / Review (TikTok, Youtube...)</label>
            <input
              type="text"
              className="input"
              placeholder="Dán link video tham khảo..."
              value={videoLink}
              onChange={e => setVideoLink(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label">Đánh giá của bạn</label>
            <textarea
              className="input"
              placeholder="Ngon không? Có gì đặc biệt?"
              rows={3}
              value={review}
              onChange={e => setReview(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRestaurantModal;
