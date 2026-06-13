'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';

interface RandomResultModalProps {
  open: boolean;
  onClose: () => void;
  restaurant: any;
  onRetry: () => void;
}

const RandomResultModal: React.FC<RandomResultModalProps> = ({ open, onClose, restaurant, onRetry }) => {
  if (!open || !restaurant) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="modal-content card" style={{
        width: '100%',
        maxWidth: '400px',
        background: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        animation: 'modalIn 0.3s ease-out'
      }}>
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎲</div>
          <h2 style={{ fontSize: '14px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Kết quả ngẫu nhiên</h2>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink)', marginBottom: '16px' }}>{restaurant.name}</h1>
          
          {restaurant.address && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px', 
              color: 'var(--t2)', 
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              <Icon name="map-pin" size={16} />
              <span>{restaurant.address}</span>
            </div>
          )}

          {restaurant.review && (
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--t3)', 
              fontStyle: 'italic', 
              lineHeight: 1.5,
              background: 'var(--bg)',
              padding: '12px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              "{restaurant.review}"
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             {restaurant.video_link && (
               <a 
                 href={restaurant.video_link.startsWith('http') ? restaurant.video_link : `https://${restaurant.video_link}`} 
                 target="_blank" 
                 rel="noreferrer" 
                 className="btn btn-primary"
                 style={{ width: '100%', justifyContent: 'center' }}
               >
                 <Icon name="zap" size={18} />
                 <span>Xem Review</span>
               </a>
             )}
             <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={onRetry}>
                <Icon name="refresh-cw" size={18} />
                <span>Thử lại</span>
             </button>
             <button className="btn" style={{ width: '100%', justifyContent: 'center', color: 'var(--t3)' }} onClick={onClose}>
                Đóng
             </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px); transform-origin: center; }
          to { opacity: 1; transform: translateY(0); transform-origin: center; }
        }
      `}</style>
    </div>
  );
};

export default RandomResultModal;
