'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

interface RandomResultModalProps {
  open: boolean;
  onClose: () => void;
  result: {
    dish: any;
    restaurant: any;
  } | null;
  allDishes: any[];
  squadName?: string;
  onRetry: (mode: 'any' | 'squad', currentDish?: any) => void;
}

const RandomResultModal: React.FC<RandomResultModalProps> = ({ open, onClose, result, allDishes, squadName, onRetry }) => {
  const [activeTab, setActiveTab] = useState<'any' | 'squad'>('any');
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleIndex, setShuffleIndex] = useState(0);

  useEffect(() => {
    if (open) {
      handleShuffle('any');
    } else {
      setIsShuffling(false);
    }
  }, [open]);

  const handleShuffle = (mode: 'any' | 'squad') => {
    setIsShuffling(true);
    
    const duration = 1500; 
    const interval = 80;
    let elapsed = 0;

    const pool = mode === 'any' ? allDishes : (result?.dish?.dish_restaurants || []);

    const timer = setInterval(() => {
      elapsed += interval;
      if (pool.length > 0) {
        setShuffleIndex(prev => (prev + 1) % pool.length);
      }
      
      if (elapsed >= duration) {
        clearInterval(timer);
        setIsShuffling(false);
        onRetry(mode, mode === 'squad' ? result?.dish : undefined);
      }
    }, interval);
  };

  if (!open) return null;

  const handleRetry = () => {
    handleShuffle(activeTab);
  };

  const handleTabChange = (tab: 'any' | 'squad') => {
    setActiveTab(tab);
    handleShuffle(tab);
  };

  // Logic to determine what to show during shuffle vs final
  const currentPool = activeTab === 'any' ? allDishes : (result?.dish?.dish_restaurants || []);
  const shuffleItem = currentPool[shuffleIndex];

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="header-text">
            <h2>Ăn gì hôm nay?</h2>
            <p>Để mình chọn giúp bạn 🎲</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'any' ? 'active' : ''}`}
            onClick={() => handleTabChange('any')}
          >
            <span className="emoji">🎲</span>
            <span>Món bất kỳ</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'squad' ? 'active' : ''}`}
            onClick={() => handleTabChange('squad')}
          >
            <span className="emoji">🍽️</span>
            <span>Quán</span>
          </button>
        </div>

        <div className="result-area">
          {activeTab === 'any' ? (
            <div className={`result-content ${isShuffling ? 'shuffling' : ''}`}>
               <div className="dish-card full-dish">
                  <span className="label">MÓN NGẪU NHIÊN</span>
                  <div className="dish-main">
                    <span className="dish-emoji">{(isShuffling ? shuffleItem : result?.dish)?.emoji || '🍜'}</span>
                    <h1 className="dish-name">{(isShuffling ? shuffleItem : result?.dish)?.name || 'Đang chọn...'}</h1>
                  </div>
               </div>
               {!isShuffling && result?.dish && (
                 <p style={{ textAlign: 'center', color: 'var(--t3)', fontSize: '13px', marginTop: '16px' }}>
                   Bấm qua tab <b>Quán</b> để chọn địa điểm cho món này nhen!
                 </p>
               )}
            </div>
          ) : (
            <div className={`result-content ${isShuffling ? 'shuffling' : ''}`}>
              <div className="dish-card mini">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <span style={{ fontSize: '24px' }}>{result?.dish?.emoji || '🍽️'}</span>
                   <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{result?.dish?.name}</h3>
                </div>
              </div>

              <div className="restaurant-card">
                <span className="label">QUÁN GỢI Ý</span>
                <div className="res-info">
                  <h3 className="res-name">{(isShuffling ? shuffleItem : result?.restaurant)?.name || 'Đang tìm quán...'}</h3>
                  {!isShuffling && result?.restaurant && (
                    <>
                      <div className="rating">
                        {[...Array(5)].map((_, i) => (
                          <Icon 
                            key={i} 
                            name="star" 
                            size={14} 
                            fill={i < (result.restaurant.rating || 5) ? "#FFB800" : "none"} 
                            color={i < (result.restaurant.rating || 5) ? "#FFB800" : "#E0E0E0"} 
                          />
                        ))}
                      </div>
                      {result.restaurant.address && (
                        <div className="res-address">
                          <Icon name="map-pin" size={14} />
                          <span>{result.restaurant.address}</span>
                        </div>
                      )}
                      <div className="res-divider"></div>
                      {result.restaurant.review && (
                        <p className="res-review">{result.restaurant.review}</p>
                      )}
                      <div className="card-actions">
                        <button 
                          className="directions-btn"
                          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.restaurant.address)}`, '_blank')}
                        >
                          <Icon name="map-pin" size={14} />
                          <span>Chỉ đường</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-retry" onClick={handleRetry} disabled={isShuffling}>
            <Icon name="sparkles" size={18} />
            <span>{isShuffling ? 'Đang xoay...' : 'Lắc lại'}</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .modal-container {
          width: 100%;
          max-width: 440px;
          background: #fff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-header {
          padding: 24px 24px 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .header-text h2 {
          font-size: 20px;
          font-weight: 800;
          color: #1A1A1A;
          margin: 0;
        }
        .header-text p {
          font-size: 14px;
          color: #666;
          margin: 4px 0 0;
        }
        .close-btn {
          background: #F5F5F7;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          cursor: pointer;
        }
        .tabs {
          display: flex;
          gap: 8px;
          padding: 0 24px 20px;
        }
        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          border-radius: 12px;
          border: 1.5px solid #F0F0F3;
          background: #fff;
          font-size: 14px;
          font-weight: 700;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn.active {
          border-color: #7C4DFF;
          color: #7C4DFF;
          background: #F5F2FF;
        }
        .tab-btn .emoji {
          font-size: 16px;
        }
        .result-area {
          min-height: 320px;
          display: flex;
          flex-direction: column;
        }
        .result-content {
          padding: 0 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .result-content.shuffling {
          opacity: 0.8;
          transform: scale(0.98);
        }
        .label {
          font-size: 11px;
          font-weight: 700;
          color: #999;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          display: block;
          text-align: center;
        }
        .dish-card {
          background: #F9F9FB;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #F0F0F3;
        }
        .dish-card.mini {
          padding: 12px 16px;
          background: #fff;
          border-style: dashed;
        }
        .dish-main {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .dish-emoji {
          font-size: 48px;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
        }
        .dish-name {
          font-size: 24px;
          font-weight: 800;
          color: #1A1A1A;
          margin: 0;
          text-align: center;
        }
        .restaurant-card {
          border: 1px solid #F0F0F3;
          border-radius: 16px;
          padding: 20px;
        }
        .res-info {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .res-name {
          font-size: 18px;
          font-weight: 800;
          color: #1A1A1A;
          margin: 0 0 8px;
          text-align: center;
        }
        .rating {
          display: flex;
          gap: 2px;
          margin-bottom: 12px;
        }
        .res-address {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #666;
          margin-bottom: 16px;
          text-align: center;
        }
        .res-divider {
          width: 100%;
          height: 1px;
          background: #F0F0F3;
          margin-bottom: 16px;
        }
        .res-review {
          font-size: 14px;
          color: #444;
          line-height: 1.5;
          text-align: center;
          margin: 0 0 20px;
        }
        .directions-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #fff;
          border: 1.5px solid #F0F0F3;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          color: #1A1A1A;
          cursor: pointer;
        }
        .card-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        .modal-footer {
          padding: 20px 24px 24px;
          display: flex;
          gap: 12px;
          border-top: 1px solid #F0F0F3;
        }
        .btn-retry {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          background: #7C4DFF;
          border: none;
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default RandomResultModal;
