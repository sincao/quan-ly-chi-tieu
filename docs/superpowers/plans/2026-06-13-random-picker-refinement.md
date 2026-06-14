# Random Food Picker Detailed UI Update Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the Random Food Picker UI and logic based on the second design image, handling squad-specific differences and adding a "Change Restaurant" feature.

**Architecture:** 
- Add `play` icon to the icon library.
- Update `RandomResultModal.tsx` to vary the top card content and labels based on the active tab.
- Update `RestaurantsPage.tsx` to support partial re-randomization (restaurant only) and squad-aware dish selection.

**Tech Stack:** React, Next.js, TypeScript, Lucide Icons.

---

### Task 1: Add Play Icon

**Files:**
- Modify: `src/components/ui/Icon.tsx`

- [ ] **Step 1: Add 'play' to IconName and switch case**

```tsx
// ...
| 'map-pin' | 'dice' | 'refresh-cw' | 'star' | 'sparkles' | 'play';
// ...
case 'play': return <svg {...s}><polygon points="5 3 19 12 5 21 5 3" /></svg>;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Icon.tsx
git commit -m "style: add play icon"
```

---

### Task 2: Update RandomResultModal UI and Props

**Files:**
- Modify: `src/components/restaurants/RandomResultModal.tsx`

- [ ] **Step 1: Update interface and state**

```tsx
interface RandomResultModalProps {
  open: boolean;
  onClose: () => void;
  result: {
    dish: any;
    restaurant: any;
  } | null;
  squadName?: string;
  onRetry: (mode: 'any' | 'squad', subMode: 'all' | 'res') => void;
}
```

- [ ] **Step 2: Update UI for Top Card and Footer**

- Top card label: "MÓN" for 'any', "QUÁN" for 'squad'.
- Top card name: `result.dish.name` for 'any', `result.restaurant.name` for 'squad'.
- Add "Xem video" button in restaurant card if `video_link` exists.
- Add "Đổi quán" button in footer.

```tsx
// Inside RandomResultModal
  const handleRetryAll = () => {
    onRetry(activeTab, 'all');
  };

  const handleRetryRes = () => {
    onRetry(activeTab, 'res');
  };

  const handleTabChange = (tab: 'any' | 'squad') => {
    setActiveTab(tab);
    onRetry(tab, 'all');
  };

  // ... In JSX ...
  <div className="dish-card">
    <span className="label">{activeTab === 'any' ? 'MÓN' : 'QUÁN'}</span>
    <div className="dish-main">
      <span className="dish-emoji">{result.dish?.emoji || '🍜'}</span>
      <h1 className="dish-name">{activeTab === 'any' ? result.dish?.name : result.restaurant?.name}</h1>
    </div>
  </div>
  // ... In Restaurant Card ...
  <div className="card-actions">
    <button className="directions-btn">
      <Icon name="map-pin" size={14} />
      <span>Chỉ đường</span>
    </button>
    {result.restaurant?.video_link && (
      <button 
        className="video-btn" 
        onClick={() => window.open(result.restaurant.video_link.startsWith('http') ? result.restaurant.video_link : `https://${result.restaurant.video_link}`, '_blank')}
      >
        <Icon name="play" size={14} color="#7C4DFF" />
        <span>Xem video</span>
      </button>
    )}
  </div>
  // ... In Footer ...
  <div className="modal-footer">
    <button className="btn-retry" onClick={handleRetryAll}>
      <Icon name="sparkles" size={18} />
      <span>Lắc lại</span>
    </button>
    <button className="btn-res" onClick={handleRetryRes}>
      <span>Đổi quán</span>
    </button>
    <button className="btn-open" onClick={onClose}>
      <Icon name="check" size={18} />
      <span>Mở quán này</span>
    </button>
  </div>
```

- [ ] **Step 3: Update CSS**

Add styles for `card-actions`, `video-btn`, and `btn-res`.

```css
        .card-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        .video-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #fff;
          border: 1.5px solid #F5F2FF;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          color: #7C4DFF;
          cursor: pointer;
        }
        .btn-res {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px 20px;
          border-radius: 14px;
          border: 1.5px solid #F0F0F3;
          background: #fff;
          font-size: 15px;
          font-weight: 700;
          color: #1A1A1A;
          cursor: pointer;
        }
```

- [ ] **Step 4: Commit**

```bash
git add src/components/restaurants/RandomResultModal.tsx
git commit -m "feat: refine RandomResultModal UI and add Change Restaurant button"
```

---

### Task 3: Update RestaurantsPage Logic

**Files:**
- Modify: `src/components/restaurants/RestaurantsPage.tsx`

- [ ] **Step 1: Update handleRetry and handlers**

- `handleRetry(mode, subMode)`:
  - If `subMode === 'res'`, keep the current dish in `randomResult` and only pick a new restaurant for it.
  - If `mode === 'squad'`, try to find a dish that matches the squad name (e.g., if squad is "Phở", look for dish "Phở").

```tsx
  const handleRetry = (mode: 'any' | 'squad', subMode: 'all' | 'res' = 'all') => {
    if (subMode === 'res' && randomResult) {
      const dish = randomResult.dish;
      if (dish.dish_restaurants && dish.dish_restaurants.length > 0) {
        const randomIndex = Math.floor(Math.random() * dish.dish_restaurants.length);
        setRandomResult({ dish, restaurant: dish.dish_restaurants[randomIndex] });
        return;
      }
    }

    if (mode === 'any') {
      handleGlobalRandom();
    } else {
      // Find dish for squad
      const squad = campaigns[0];
      let dishForSquad = selectedDish;
      if (squad) {
        const match = dishes.find(d => d.name.toLowerCase().includes(squad.name.toLowerCase()) || squad.name.toLowerCase().includes(d.name.toLowerCase()));
        if (match) dishForSquad = match;
      }
      
      if (!dishForSquad || !dishForSquad.dish_restaurants || dishForSquad.dish_restaurants.length === 0) {
        handleGlobalRandom();
        return;
      }
      const randomIndex = Math.floor(Math.random() * dishForSquad.dish_restaurants.length);
      setRandomResult({ dish: dishForSquad, restaurant: dishForSquad.dish_restaurants[randomIndex] });
    }
  };
```

- [ ] **Step 2: Commit**

```bash
git add src/components/restaurants/RestaurantsPage.tsx
git commit -m "feat: implement Change Restaurant and squad-aware randomization"
```
