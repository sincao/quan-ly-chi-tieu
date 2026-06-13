# Random Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a random dish and random restaurant selection feature to the Restaurants page, including a results modal.

**Architecture:** 
- Implement random selection logic directly in `RestaurantsPage.tsx`.
- Create a reusable `RandomResultModal` component to display the selected restaurant.
- Use the existing `Icon` component with a `dice` icon for the triggers.

**Tech Stack:** React, Next.js, TypeScript, Supabase (data is already fetched).

---

### Task 1: Create RandomResultModal Component

**Files:**
- Create: `src/components/restaurants/RandomResultModal.tsx`

- [ ] **Step 1: Create the Modal component**

```tsx
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
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default RandomResultModal;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/restaurants/RandomResultModal.tsx
git commit -m "feat: add RandomResultModal component"
```

### Task 2: Implement Random Logic in RestaurantsPage

**Files:**
- Modify: `src/components/restaurants/RestaurantsPage.tsx`

- [ ] **Step 1: Add new states for randomizing**

Around line 25, add:
```tsx
  const [randomModalOpen, setRandomModalOpen] = useState(false);
  const [randomResult, setRandomResult] = useState<any>(null);
```

- [ ] **Step 2: Add random handlers**

After `useEffect` (around line 55), add:
```tsx
  const handleRandomDish = () => {
    if (dishes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * dishes.length);
    setSelectedDishId(dishes[randomIndex].id);
  };

  const handleRandomRes = () => {
    const dish = dishes.find(d => d.id === selectedDishId);
    if (!dish || !dish.dish_restaurants || dish.dish_restaurants.length === 0) return;
    const randomIndex = Math.floor(Math.random() * dish.dish_restaurants.length);
    setRandomResult(dish.dish_restaurants[randomIndex]);
    setRandomModalOpen(true);
  };
```

- [ ] **Step 3: Import and add RandomResultModal to JSX**

Import:
```tsx
import RandomResultModal from './RandomResultModal';
```

Add at the bottom of the component (near other modals):
```tsx
      <RandomResultModal 
        open={randomModalOpen} 
        onClose={() => setRandomModalOpen(false)} 
        restaurant={randomResult} 
        onRetry={handleRandomRes} 
      />
```

- [ ] **Step 4: Commit**

```bash
git add src/components/restaurants/RestaurantsPage.tsx
git commit -m "feat: implement random logic in RestaurantsPage"
```

### Task 3: Add UI Icons for Randomization

**Files:**
- Modify: `src/components/restaurants/RestaurantsPage.tsx`

- [ ] **Step 1: Add 🎲 icon to Dish List header**

Modify line 170 (inside `card-h` of dish list):
```tsx
          <div className="card-h">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3>Danh sách món ăn</h3>
              <button 
                className="icon-btn sm" 
                onClick={handleRandomDish}
                title="Chọn ngẫu nhiên món"
                style={{ color: 'var(--purple-600)' }}
                disabled={dishes.length === 0}
              >
                <Icon name="dice" size={16} />
              </button>
            </div>
            <span className="badge gray">{dishes.length}</span>
          </div>
```

- [ ] **Step 2: Add 🎲 icon to Restaurant List header**

Modify lines 223-227 (inside `card-h` of restaurant details):
```tsx
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={handleRandomRes}
                    disabled={!selectedDish?.dish_restaurants || selectedDish.dish_restaurants.length === 0}
                  >
                    <Icon name="dice" size={14} />
                    <span>Random quán</span>
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={handleAddRes}>
                    <Icon name="plus" size={14} />
                    <span>Thêm quán</span>
                  </button>
                </div>
```

- [ ] **Step 3: Verify the changes and commit**

```bash
git add src/components/restaurants/RestaurantsPage.tsx
git commit -m "feat: add dice icons for random feature"
```

### Task 4: Add Unit Tests for Random Logic

**Files:**
- Create: `__tests__/random-logic.test.ts`

- [ ] **Step 1: Write tests for random selection**

```tsx
import { describe, it, expect } from 'vitest';

const pickRandom = (items: any[]) => {
  if (items.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
};

describe('Random Selection Logic', () => {
  it('should pick a random item from a list', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = pickRandom(items);
    expect(items).toContain(result);
  });

  it('should return null for empty list', () => {
    expect(pickRandom([])).toBeNull();
  });

  it('should pick the only item if list has one element', () => {
    const items = [{ id: 1 }];
    expect(pickRandom(items)).toEqual({ id: 1 });
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npm test __tests__/random-logic.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add __tests__/random-logic.test.ts
git commit -m "test: add unit tests for random selection logic"
```
