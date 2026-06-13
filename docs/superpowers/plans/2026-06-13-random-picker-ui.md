# Random Food Picker UI Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the Random Food Picker UI to match the design provided in the image, including tabs for "Any dish" and "Squad specific" results, and a rich card layout for the selected dish and restaurant.

**Architecture:** 
- Enhance `RandomResultModal.tsx` with a multi-tab layout and styled cards.
- Update `RestaurantsPage.tsx` to fetch squad data and pass it to the modal.
- Implement auto-randomization logic when opening the modal or switching tabs.

**Tech Stack:** React, Next.js, TypeScript, Lucide Icons (via Icon component), CSS-in-JS (style jsx).

---

### Task 1: Update RandomResultModal UI

**Files:**
- Modify: `src/components/restaurants/RandomResultModal.tsx`

- [ ] **Step 1: Update props and add state for tabs**

Modify the interface and component state:
```tsx
interface RandomResultModalProps {
  open: boolean;
  onClose: () => void;
  result: {
    dish: any;
    restaurant: any;
  } | null;
  squadName?: string;
  onRetry: (mode: 'any' | 'squad') => void;
}
```

- [ ] **Step 2: Implement the new UI layout**

Replace the content of `RandomResultModal` with the styled version from the image. Use the existing `Icon` component.

```tsx
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
  squadName?: string;
  onRetry: (mode: 'any' | 'squad') => void;
}

const RandomResultModal: React.FC<RandomResultModalProps> = ({ open, onClose, result, squadName, onRetry }) => {
  const [activeTab, setActiveTab] = useState<'any' | 'squad'>('any');

  useEffect(() => {
    if (open && !result) {
       onRetry(activeTab);
    }
  }, [open]);

  if (!open) return null;

  const handleRetry = () => {
    onRetry(activeTab);
  };

  const handleTabChange = (tab: 'any' | 'squad') => {
    setActiveTab(tab);
    onRetry(tab);
  };

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
            <span>Quán cho {squadName || 'bạn'}</span>
          </button>
        </div>

        {result ? (
          <div className="result-content">
            <div className="dish-card">
              <span className="label">MÓN</span>
              <div className="dish-main">
                <span className="dish-emoji">{result.dish?.emoji || '🍜'}</span>
                <h1 className="dish-name">{result.dish?.name}</h1>
              </div>
            </div>

            <div className="restaurant-card">
              <span className="label">QUÁN GỢI Ý</span>
              <div className="res-info">
                <h3 className="res-name">{result.restaurant?.name}</h3>
                <div className="rating">
                  {[...Array(5)].map((_, i) => (
                    <Icon key={i} name="star" size={14} fill="#FFB800" color="#FFB800" />
                  ))}
                </div>
                {result.restaurant?.address && (
                  <div className="res-address">
                    <Icon name="map-pin" size={14} />
                    <span>{result.restaurant.address}</span>
                  </div>
                )}
                <div className="res-divider"></div>
                {result.restaurant?.review && (
                  <p className="res-review">{result.restaurant.review}</p>
                )}
                <button className="directions-btn">
                  <Icon name="map-pin" size={14} />
                  <span>Chỉ đường</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="loading-state">
             <div className="spinner"></div>
             <p>Đang quay số...</p>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-retry" onClick={handleRetry}>
            <Icon name="sparkles" size={18} />
            <span>Lắc lại</span>
          </button>
          <button className="btn-open" onClick={onClose}>
            <Icon name="check" size={18} />
            <span>Mở quán này</span>
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
        .result-content {
          padding: 0 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
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
        .dish-main {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .dish-emoji {
          font-size: 40px;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
        }
        .dish-name {
          font-size: 24px;
          font-weight: 800;
          color: #1A1A1A;
          margin: 0;
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
        .modal-footer {
          padding: 20px 24px 24px;
          display: flex;
          gap: 12px;
          border-top: 1px solid #F0F0F3;
        }
        .btn-retry, .btn-open {
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
        }
        .btn-retry {
          background: #fff;
          border: 1.5px solid #F0F0F3;
          color: #1A1A1A;
        }
        .btn-open {
          background: #7C4DFF;
          border: none;
          color: #fff;
        }
        .loading-state {
          padding: 60px 24px;
          text-align: center;
          color: #666;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #F0F0F3;
          border-top-color: #7C4DFF;
          border-radius: 50%;
          margin: 0 auto 16px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RandomResultModal;
```

- [ ] **Step 3: Commit**

```bash
git add src/components/restaurants/RandomResultModal.tsx
git commit -m "feat: update RandomResultModal UI to match design"
```

---

### Task 2: Update RestaurantsPage Data and Logic

**Files:**
- Modify: `src/components/restaurants/RestaurantsPage.tsx`

- [ ] **Step 1: Fetch squads/campaigns for context**

Add `campaigns` state and fetch in `useEffect`:
```tsx
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    fetchDishes();
    const fetchSquads = async () => {
      const { campaigns: campData } = await getSquadData(user.id);
      setCampaigns(campData);
    };
    fetchSquads();
  }, [user.id]);
```

- [ ] **Step 2: Update random handlers to pass dish info**

Modify `handleGlobalRandom` and `handleRandomRes`:
```tsx
  const handleRandomAction = (mode: 'any' | 'squad') => {
    let sourceDishes = dishes;
    
    // If squad mode, we might want to filter or just use all for now 
    // but the image implies a specific squad "Phở"
    // For now, let's just pick from all, but we can refine later
    
    const allRestaurants: { dish: any, restaurant: any }[] = sourceDishes.flatMap(d => 
      (d.dish_restaurants || []).map((r: any) => ({ dish: d, restaurant: r }))
    );

    if (allRestaurants.length === 0) return;
    const randomIndex = Math.floor(Math.random() * allRestaurants.length);
    setRandomResult(allRestaurants[randomIndex]);
    setRandomModalOpen(true);
  };
```

- [ ] **Step 3: Update Modal component call**

Pass `result` (object with dish and restaurant) and `squadName`:
```tsx
      <RandomResultModal 
        open={randomModalOpen} 
        onClose={() => setRandomModalOpen(false)} 
        result={randomResult} 
        squadName={campaigns.length > 0 ? campaigns[0].name : undefined}
        onRetry={handleRandomAction} 
      />
```

- [ ] **Step 4: Commit**

```bash
git add src/components/restaurants/RestaurantsPage.tsx
git commit -m "feat: update random logic and pass squad context to modal"
```

---

### Task 3: Final Polish and Verification

- [ ] **Step 1: Verify the UI matches the image**

Check colors, spacing, and icons. Ensure the "Lắc lại" button re-randomizes.

- [ ] **Step 2: Add auto-randomize when clicking "Ăn gì hôm nay?"**

Ensure `handleRandomAction` is called immediately.

- [ ] **Step 3: Commit final changes**

```bash
git commit -m "chore: final polish for random food picker"
```
