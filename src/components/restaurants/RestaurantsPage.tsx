'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { User } from '@supabase/supabase-js';
import { getDishes, deleteDish, deleteRestaurant } from '@/lib/supabase/queries';
import ConfirmModal from '@/components/ui/ConfirmModal';
import AddDishModal from './AddDishModal';
import AddRestaurantModal from './AddRestaurantModal';
import RandomResultModal from './RandomResultModal';

interface RestaurantsPageProps {
  user: User;
}

const RestaurantsPage: React.FC<RestaurantsPageProps> = ({ user }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [dishes, setDishes] = useState<any[]>([]);
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  
  // Modal states
  const [isDishModalOpen, setDishModalOpen] = useState(false);
  const [isResModalOpen, setResModalOpen] = useState(false);
  const [randomModalOpen, setRandomModalOpen] = useState(false);
  const [randomResult, setRandomResult] = useState<any>(null);
  const [editDish, setEditDish] = useState<any>(null);
  const [editRes, setEditRes] = useState<any>(null);

  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'primary' | 'danger';
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'primary'
  });

  const fetchDishes = async (autoSelect = false) => {
    setLoading(true);
    const { data } = await getDishes(user.id);
    if (data) {
      setDishes(data);
      if (data.length > 0) {
        if (autoSelect || !selectedDishId || !data.find(d => d.id === selectedDishId)) {
          setSelectedDishId(data[0].id);
        }
      } else {
        setSelectedDishId(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDishes();
  }, [user.id]);

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

  const handleDeleteDish = (dish: any) => {
    setConfirm({
      open: true,
      title: 'Xóa món ăn',
      message: `Bạn có chắc chắn muốn xóa "${dish.name}" và tất cả địa điểm liên quan không?`,
      type: 'danger',
      onConfirm: async () => {
        await deleteDish(dish.id);
        fetchDishes(true);
        setConfirm(c => ({ ...c, open: false }));
      }
    });
  };

  const handleDeleteRes = (res: any) => {
    setConfirm({
      open: true,
      title: 'Xóa địa điểm',
      message: `Bạn có chắc chắn muốn xóa quán "${res.name}" không?`,
      type: 'danger',
      onConfirm: async () => {
        await deleteRestaurant(res.id);
        fetchDishes();
        setConfirm(c => ({ ...c, open: false }));
      }
    });
  };

  const handleEditDish = (dish: any) => {
    setEditDish(dish);
    setDishModalOpen(true);
  };

  const handleEditRes = (res: any) => {
    setEditRes(res);
    setResModalOpen(true);
  };

  const handleAddDish = () => {
    setEditDish(null);
    setDishModalOpen(true);
  };

  const handleAddRes = () => {
    setEditRes(null);
    setResModalOpen(true);
  };

  if (loading && dishes.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  const selectedDish = dishes.find(d => d.id === selectedDishId);

  if (dishes.length === 0) {
    return (
      <div className="restaurants-empty" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: 'calc(100vh - 120px)', 
        padding: '24px',
        textAlign: 'center'
      }}>
        <div className="empty-illustration" style={{ marginBottom: '32px', position: 'relative' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
             <div style={{ 
               width: '80px', height: '80px', borderRadius: '50%', border: '6px solid var(--line)', 
               position: 'absolute', top: '20px', left: '20px' 
             }}></div>
             <div style={{ width: '6px', height: '60px', background: 'var(--line)', borderRadius: '4px', position: 'absolute', top: '30px', left: '10px' }}></div>
             <div style={{ width: '6px', height: '60px', background: 'var(--line)', borderRadius: '4px', position: 'absolute', top: '30px', right: '10px' }}></div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
            <span style={{ fontSize: '32px', filter: 'grayscale(1)', opacity: 0.5 }}>🍜</span>
            <span style={{ fontSize: '32px', filter: 'grayscale(1)', opacity: 0.5 }}>🥤</span>
            <span style={{ fontSize: '32px', filter: 'grayscale(1)', opacity: 0.5 }}>🥖</span>
          </div>
        </div>
        
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', color: 'var(--ink)' }}>
          {t('restaurants.empty_title')}
        </h2>
        
        <p style={{ 
          maxWidth: '500px', 
          lineHeight: 1.6, 
          color: 'var(--t2)', 
          marginBottom: '32px',
          fontSize: '15px'
        }}>
          {t('restaurants.empty_desc')}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleAddDish}>
            <Icon name="plus" size={18} />
            <span>{t('restaurants.add_dish')}</span>
          </button>
        </div>
        <AddDishModal open={isDishModalOpen} onClose={() => setDishModalOpen(false)} userId={user.id} onSuccess={() => fetchDishes(true)} editDish={editDish} />
      </div>
    );
  }

  return (
    <div className="main-inner">
      <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)' }}>{t('nav.restaurants')}</h1>
            <p style={{ fontSize: '13px', color: 'var(--t3)', marginTop: '4px' }}>Nơi lưu trữ những món ngon và quán tủ của riêng bạn.</p>
          </div>
          <button className="btn btn-primary" onClick={handleAddDish}>
            <Icon name="plus" size={16} />
            <span>{t('restaurants.add_dish')}</span>
          </button>
        </div>
      </div>

      <div className="dash-row r-1-2" style={{ alignItems: 'start' }}>
        <div className="card flush" style={{ display: 'flex', flexDirection: 'column' }}>
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
          <div style={{ padding: '8px' }}>
            {dishes.map(dish => (
              <div 
                key={dish.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '4px'
                }}
                className="dish-item-wrap"
              >
                <button 
                  onClick={() => setSelectedDishId(dish.id)}
                  style={{ 
                    flex: 1,
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: selectedDishId === dish.id ? 'var(--purple-100)' : 'transparent',
                    color: selectedDishId === dish.id ? 'var(--purple-700)' : 'var(--ink)',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{dish.emoji || '🍽️'}</span>
                  <span style={{ fontWeight: 700, fontSize: '14px', flex: 1 }}>{dish.name}</span>
                </button>
                <div style={{ display: 'flex', gap: '2px' }}>
                   <button className="icon-btn sm" onClick={() => handleEditDish(dish)}><Icon name="edit" size={14} /></button>
                   <button className="icon-btn sm" onClick={() => handleDeleteDish(dish)} style={{ color: 'var(--rose)' }}><Icon name="trash" size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card flush">
          {selectedDish ? (
            <>
              <div className="card-h" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>{selectedDish.emoji || '🍽️'}</span>
                  <div>
                    <h3 style={{ fontSize: '18px' }}>{selectedDish.name}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--t3)' }}>{selectedDish.dish_restaurants?.length || 0} địa điểm</p>
                  </div>
                </div>
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
              </div>
              <div className="card-body">
                {selectedDish.dish_restaurants && selectedDish.dish_restaurants.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedDish.dish_restaurants.map((res: any) => (
                      <div key={res.id} style={{ 
                        padding: '16px', 
                        borderRadius: '12px', 
                        background: 'var(--bg-2)',
                        border: '1px solid var(--line-2)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                           <h4 style={{ fontWeight: 700, fontSize: '15px' }}>{res.name}</h4>
                           <div style={{ display: 'flex', gap: '8px' }}>
                              {res.video_link && (
                                <a href={res.video_link.startsWith('http') ? res.video_link : `https://${res.video_link}`} target="_blank" rel="noreferrer" className="icon-btn sm" style={{ color: 'var(--rose)' }}>
                                  <Icon name="zap" size={14} />
                                </a>
                              )}
                              <button className="icon-btn sm" onClick={() => handleEditRes(res)}><Icon name="edit" size={14} /></button>
                              <button className="icon-btn sm" onClick={() => handleDeleteRes(res)} style={{ color: 'var(--rose)' }}><Icon name="trash" size={14} /></button>
                           </div>
                        </div>
                        {res.address && (
                          <div style={{ fontSize: '13px', color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <Icon name="map-pin" size={14} />
                            <span>{res.address}</span>
                          </div>
                        )}
                        {res.review && (
                          <p style={{ fontSize: '13px', color: 'var(--t3)', lineHeight: 1.5, background: '#fff', padding: '10px', borderRadius: '8px', borderLeft: '3px solid var(--purple-400)' }}>
                            "{res.review}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--t3)' }}>
                    <p>Chưa có quán nào cho món này.</p>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={handleAddRes}>Thêm quán ngay</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: '80px', textAlign: 'center', color: 'var(--t3)' }}>
              <p>Chọn một món ăn bên trái để xem chi tiết.</p>
            </div>
          )}
        </div>
      </div>

      <AddDishModal open={isDishModalOpen} onClose={() => setDishModalOpen(false)} userId={user.id} onSuccess={() => fetchDishes()} editDish={editDish} />
      {selectedDishId && <AddRestaurantModal open={isResModalOpen} onClose={() => setResModalOpen(false)} dishId={selectedDishId} onSuccess={() => fetchDishes()} editRes={editRes} />}
      <RandomResultModal open={randomModalOpen} onClose={() => setRandomModalOpen(false)} result={randomResult} />
      <ConfirmModal open={confirm.open} title={confirm.title} message={confirm.message} type={confirm.type} onConfirm={confirm.onConfirm} onClose={() => setConfirm(c => ({ ...c, open: false }))} />
    </div>
  );
};

export default RestaurantsPage;
