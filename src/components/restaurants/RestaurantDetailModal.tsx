'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';

interface RestaurantDetailModalProps {
  open: boolean;
  onClose: () => void;
  restaurant: any;
  dishName?: string;
  onEdit: () => void;
  onDelete: () => void;
}

const RestaurantDetailModal: React.FC<RestaurantDetailModalProps> = ({ open, onClose, restaurant, dishName, onEdit, onDelete }) => {
  if (!open || !restaurant) return null;

  return (
    <div className="scrim" onClick={onClose} style={{ zIndex: 400 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', borderRadius: '24px' }}>
        <div className="modal-head" style={{ padding: '24px 24px 16px', border: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)' }}>
              {restaurant.name}
            </h3>
            {dishName && (
              <p style={{ fontSize: '14px', color: 'var(--t3)', fontWeight: 500 }}>
                cho món {dishName}
              </p>
            )}
          </div>
          <button className="close" onClick={onClose} style={{ background: 'var(--bg-2)', borderRadius: '50%', width: '32px', height: '32px' }}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '0 24px 24px' }}>
          {/* Rating */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
            {[...Array(5)].map((_, i) => (
              <Icon 
                key={i} 
                name="star" 
                size={18} 
                fill={i < (restaurant.rating || 5) ? "#FFB800" : "none"} 
                color={i < (restaurant.rating || 5) ? "#FFB800" : "#E0E0E0"} 
              />
            ))}
          </div>

          {/* Address */}
          {restaurant.address && (
            <div style={{ marginBottom: '24px', background: 'var(--bg)', padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name="map-pin" size={18} color="var(--purple-600)" />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>ĐỊA CHỈ</div>
                <div style={{ fontSize: '14px', color: 'var(--ink)', fontWeight: 600, lineHeight: 1.4 }}>{restaurant.address}</div>
              </div>
            </div>
          )}

          {/* Review */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>REVIEW CỦA BẠN</div>
            <div style={{ fontSize: '15px', color: 'var(--t1)', lineHeight: 1.6, fontStyle: restaurant.review ? 'normal' : 'italic' }}>
              {restaurant.review || 'Chưa có review nào cho quán này.'}
            </div>
          </div>

          {/* Video Link */}
          {restaurant.video_link && (
            <button 
              onClick={() => window.open(restaurant.video_link.startsWith('http') ? restaurant.video_link : `https://${restaurant.video_link}`, '_blank')}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                background: '#F5F2FF',
                border: '1.5px solid #E8E0FF',
                color: '#7C4DFF',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                marginBottom: '24px'
              }}
            >
              <Icon name="play" size={16} />
              <span>Xem video review</span>
            </button>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--line-2)', paddingTop: '24px' }}>
            <button 
              className="btn btn-outline" 
              style={{ flex: 1, borderRadius: '12px', padding: '12px' }}
              onClick={() => { onClose(); onEdit(); }}
            >
              <Icon name="edit" size={16} />
              <span>Sửa thông tin</span>
            </button>
            <button 
              className="btn" 
              style={{ width: '48px', borderRadius: '12px', background: 'var(--rose-2)', color: 'var(--rose)', border: 'none', display: 'grid', placeItems: 'center' }}
              onClick={() => { onClose(); onDelete(); }}
            >
              <Icon name="trash" size={18} />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal {
          animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default RestaurantDetailModal;
