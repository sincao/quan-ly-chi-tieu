'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { User } from '@supabase/supabase-js';
import { getDishes, deleteDish, deleteRestaurant, getSquadData } from '@/lib/supabase/queries';
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
  const [campaigns, setCampaigns] = useState<any[]>([]);
  
  // Search states
  const [dishSearch, setDishSearch] = useState('');
  const [resSearch, setResSearch] = useState('');

  // Modal states
  const [isDishModalOpen, setDishModalOpen] = useState(false);
  const [isResModalOpen, setResModalOpen] = useState(false);
  const [randomModalOpen, setRandomModalOpen] = useState(false);
  const [randomResult, setRandomResult] = useState<{ dish: any, restaurant: any } | null>(null);
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
    const fetchSquads = async () => {
      const { campaigns: campData } = await getSquadData(user.id);
      if (campData) setCampaigns(campData);
    };
    fetchSquads();
  }, [user.id]);

  const handleRandomDish = () => {
    if (dishes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * dishes.length);
    const dish = dishes[randomIndex];
    
    // Pick a restaurant for this dish if any exist
    let restaurant = null;
    if (dish.dish_restaurants && dish.dish_restaurants.length > 0) {
      const resIndex = Math.floor(Math.random() * dish.dish_restaurants.length);
      restaurant = dish.dish_restaurants[resIndex];
    }
    
    setRandomResult({ dish, restaurant });
  };

  const handleRandomResOnly = (currentDish: any) => {
    if (!currentDish || !currentDish.dish_restaurants || currentDish.dish_restaurants.length === 0) return;
    const randomIndex = Math.floor(Math.random() * currentDish.dish_restaurants.length);
    setRandomResult({ dish: currentDish, restaurant: currentDish.dish_restaurants[randomIndex] });
  };

  const handleRetry = (mode: 'any' | 'squad', currentDish?: any) => {
    if (mode === 'any') {
      handleRandomDish();
    } else {
      handleRandomResOnly(currentDish);
    }
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

  const handleOpenRandom = () => {
    handleRandomDish();
    setRandomModalOpen(true);
  };

  if (loading && dishes.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  const filteredDishes = dishes.filter(d => 
    d.name.toLowerCase().includes(dishSearch.toLowerCase())
  );

  const selectedDish = dishes.find(d => d.id === selectedDishId);
  
  const filteredRestaurants = selectedDish?.dish_restaurants?.filter((res: any) => 
    res.name.toLowerCase().includes(resSearch.toLowerCase()) || 
    (res.address && res.address.toLowerCase().includes(resSearch.toLowerCase()))
  ) || [];

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ink)', marginBottom: '4px' }}>{t('nav.restaurants')}</h1>
          <p style={{ fontSize: '14px', color: 'var(--t3)', fontWeight: 500 }}>
             Tìm xem hôm nay nên ăn món gì ở đâu nhen!
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn" 
            style={{ 
              background: 'linear-gradient(135deg, #7C4DFF 0%, #6938E8 100%)', 
              color: '#fff', 
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(124, 77, 255, 0.25)'
            }} 
            onClick={handleOpenRandom}
            disabled={dishes.length === 0}
          >
            <span style={{ fontSize: '18px' }}>🎲</span>
            <span>Ăn gì hôm nay?</span>
          </button>
        </div>
      </div>

      <div className="dash-row r-1-2" style={{ alignItems: 'start' }}>
        <div className="card flush" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-h" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Danh sách món ăn</h3>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={handleAddDish}
                style={{ padding: '6px 12px', borderRadius: '8px' }}
              >
                <Icon name="plus" size={14} />
                <span>Thêm món</span>
              </button>
            </div>
          </div>
          
          <div style={{ padding: '0 16px 12px' }}>
             <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }}>
                   <Icon name="search" size={14} />
                </div>
                <input 
                  type="text" 
                  placeholder="Tìm món..." 
                  value={dishSearch}
                  onChange={(e) => setDishSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--line)',
                    background: 'var(--bg)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
             </div>
          </div>

          <div style={{ padding: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
            {filteredDishes.map(dish => (
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
            {filteredDishes.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--t3)', fontSize: '13px' }}>
                Không tìm thấy món này.
              </div>
            )}
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
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 20px 0' }}>
                 <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }}>
                       <Icon name="search" size={14} />
                    </div>
                    <input 
                      type="text" 
                      placeholder={`Tìm quán ${selectedDish.name}...`} 
                      value={resSearch}
                      onChange={(e) => setResSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        borderRadius: '10px',
                        border: '1.5px solid var(--line)',
                        background: 'var(--bg)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                 </div>
              </div>

              <div className="card-body res-table-wrapper" style={{ maxHeight: '65vh', overflowY: 'auto', padding: 0 }}>
                <table className="res-table">
                  <thead>
                    <tr>
                      <th>QUÁN</th>
                      <th>ĐỊA CHỈ</th>
                      <th>VIDEO</th>
                      <th>REVIEW CỦA BẠN</th>
                      <th>ĐÁNH GIÁ</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRestaurants.map((res: any) => (
                      <tr key={res.id}>
                        <td style={{ fontWeight: 800 }}>{res.name}</td>
                        <td>
                          {res.address && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--t2)' }}>
                              <Icon name="map-pin" size={14} />
                              <span>{res.address}</span>
                            </div>
                          )}
                        </td>
                        <td>
                          {res.video_link ? (
                            <button 
                              className="btn-xem"
                              onClick={() => window.open(res.video_link.startsWith('http') ? res.video_link : `https://${res.video_link}`, '_blank')}
                            >
                              <Icon name="play" size={12} />
                              <span>Xem</span>
                            </button>
                          ) : '-'}
                        </td>
                        <td style={{ color: 'var(--t3)', fontSize: '13px' }}>{res.review || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[...Array(5)].map((_, i) => (
                              <Icon 
                                key={i} 
                                name="star" 
                                size={12} 
                                fill={i < (res.rating || 5) ? "#FFB800" : "none"} 
                                color={i < (res.rating || 5) ? "#FFB800" : "#E0E0E0"} 
                              />
                            ))}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="icon-btn sm" onClick={() => handleEditRes(res)}><Icon name="edit" size={14} /></button>
                            <button className="icon-btn sm" onClick={() => handleDeleteRes(res)} style={{ color: 'var(--rose)' }}><Icon name="trash" size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredRestaurants.length === 0 && (
                  <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--t3)' }}>
                    <p>{resSearch ? 'Không tìm thấy quán này.' : 'Chưa có quán nào cho món này.'}</p>
                    {!resSearch && <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={handleAddRes}>Thêm quán ngay</button>}
                  </div>
                )}
              </div>
              
              <div className="card-f" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)' }}>
                 <span style={{ fontSize: '13px', color: 'var(--t3)' }}>
                   Hiện {filteredRestaurants.length} / {selectedDish.dish_restaurants?.length || 0} quán
                 </span>
                 <button className="btn btn-outline btn-sm" onClick={handleAddRes} style={{ padding: '6px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="plus" size={14} />
                    <span style={{ fontWeight: 700 }}>Thêm quán</span>
                 </button>
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
      {selectedDishId && (
        <AddRestaurantModal 
          open={isResModalOpen} 
          onClose={() => setResModalOpen(false)} 
          dishId={selectedDishId} 
          dishName={selectedDish?.name}
          onSuccess={() => fetchDishes()} 
          editRes={editRes} 
        />
      )}
      <RandomResultModal 
        open={randomModalOpen} 
        onClose={() => setRandomModalOpen(false)} 
        result={randomResult}
        allDishes={dishes}
        squadName={campaigns.length > 0 ? campaigns[0].name : undefined}
        onRetry={handleRetry}
      />
      <ConfirmModal open={confirm.open} title={confirm.title} message={confirm.message} type={confirm.type} onConfirm={confirm.onConfirm} onClose={() => setConfirm(c => ({ ...c, open: false }))} />

      <style jsx>{`
        .res-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .res-table th {
          text-align: left;
          padding: 12px 20px;
          background: var(--bg);
          color: var(--t3);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--line);
        }
        .res-table td {
          padding: 16px 20px;
          border-bottom: 1px solid var(--line-2);
          vertical-align: middle;
        }
        .res-table tr:hover {
          background: var(--bg);
        }
        .btn-xem {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #F5F2FF;
          border: 1px solid #E8E0FF;
          border-radius: 20px;
          color: #7C4DFF;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-xem:hover {
          background: #7C4DFF;
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default RestaurantsPage;
