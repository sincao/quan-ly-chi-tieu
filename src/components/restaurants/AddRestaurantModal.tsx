'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { addRestaurant, updateRestaurant } from '@/lib/supabase/queries';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface AddRestaurantModalProps {
  open: boolean;
  onClose: () => void;
  dishId: string;
  dishName?: string;
  onSuccess: () => void;
  editRes?: any;
}

const AddRestaurantModal: React.FC<AddRestaurantModalProps> = ({ open, onClose, dishId, dishName, onSuccess, editRes }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (editRes) {
        setName(editRes.name);
        setAddress(editRes.address || '');
        setVideoLink(editRes.video_link || '');
        setReview(editRes.review || '');
        setRating(editRes.rating || 5);
      } else {
        setName('');
        setAddress('');
        setVideoLink('');
        setReview('');
        setRating(5);
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
        await updateRestaurant(editRes.id, { name, address, video_link: videoLink, review, rating });
      } else {
        await addRestaurant({ dish_id: dishId, name, address, video_link: videoLink, review, rating });
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
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-head">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>
              {editRes ? 'Chỉnh sửa quán' : 'Thêm quán'}
            </h3>
            {dishName && (
              <p style={{ fontSize: '13px', color: 'var(--t3)', marginTop: '2px' }}>
                cho món {dishName}
              </p>
            )}
          </div>
          <button className="close" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          <div className="field" style={{ marginBottom: '20px' }}>
            <label className="label" style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Tên quán</label>
            <input
              type="text"
              className={`input ${error ? 'error' : ''}`}
              placeholder="VD: Phở Thìn Lò Đúc"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              autoFocus
              style={{
                borderRadius: '12px',
                border: '1.5px solid #F0F0F3',
                padding: '12px 16px',
                fontSize: '14px',
                width: '100%',
                outline: 'none'
              }}
            />
            {error && <span style={{ color: 'var(--rose)', fontSize: '12px', marginTop: '4px' }}>{error}</span>}
          </div>

          <div className="field" style={{ marginBottom: '20px' }}>
            <label className="label" style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Địa chỉ</label>
            <input
              type="text"
              className="input"
              placeholder="Số nhà, đường, quận..."
              value={address}
              onChange={e => setAddress(e.target.value)}
              style={{
                borderRadius: '12px',
                border: '1.5px solid #F0F0F3',
                padding: '12px 16px',
                fontSize: '14px',
                width: '100%',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="field">
              <label className="label" style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>
                Link video <span style={{ fontWeight: 400, color: 'var(--t3)' }}>(tuỳ chọn)</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="TikTok / YouTube..."
                value={videoLink}
                onChange={e => setVideoLink(e.target.value)}
                style={{
                  borderRadius: '12px',
                  border: '1.5px solid #F0F0F3',
                  padding: '12px 16px',
                  fontSize: '14px',
                  width: '100%',
                  outline: 'none'
                }}
              />
            </div>
            <div className="field">
              <label className="label" style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Đánh giá</label>
              <div style={{ display: 'flex', gap: '4px', height: '44px', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      padding: 0,
                      color: star <= rating ? '#FFB800' : '#E0E0E0'
                    }}
                  >
                    <Icon name="star" size={24} fill={star <= rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="field">
            <label className="label" style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>
              Review của bạn <span style={{ fontWeight: 400, color: 'var(--t3)' }}>(tuỳ chọn)</span>
            </label>
            <textarea
              className="input"
              placeholder="Món gì ngon? Giá cả, không gian, mẹo gọi món..."
              rows={4}
              value={review}
              onChange={e => setReview(e.target.value)}
              style={{
                borderRadius: '12px',
                border: '1.5px solid #F0F0F3',
                padding: '12px 16px',
                fontSize: '14px',
                width: '100%',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>
        </div>

        <div className="modal-foot" style={{ padding: '16px 24px', borderTop: '1px solid #F0F0F3', gap: '12px' }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ borderRadius: '12px', padding: '12px 24px' }}>Huỷ</button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={loading}
            style={{ 
              borderRadius: '12px', 
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              t('common.saving')
            ) : (
              <>
                <Icon name="check" size={18} />
                <span>{editRes ? 'Lưu thay đổi' : 'Thêm quán'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal {
          animation: modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .input:focus {
          border-color: var(--purple-400) !important;
          box-shadow: 0 0 0 4px rgba(124, 77, 255, 0.1);
        }
        .input.error {
          border-color: var(--rose) !important;
        }
      `}</style>
    </div>
  );
};

export default AddRestaurantModal;
