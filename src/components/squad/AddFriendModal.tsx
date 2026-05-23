'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { searchProfiles, sendFriendRequest, getFriendships } from '@/lib/supabase/queries';

interface AddFriendModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ open, onClose, userId, onSuccess }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [friendships, setFriendships] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (open) {
      loadFriendships();
      setQuery('');
      setResults([]);
      setHasSearched(false);
    }
  }, [open, userId]);

  async function loadFriendships() {
    const { data } = await getFriendships(userId);
    if (data) setFriendships(data);
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    
    if (!cleanQuery) {
      setHasSearched(false);
      setResults([]);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const { data } = await searchProfiles(cleanQuery);
      if (data) {
        setResults(data.filter((p: any) => p.id !== userId));
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (friendId: string) => {
    // Không set loading toàn cục để tránh chớp màn hình search
    try {
      const { error } = await sendFriendRequest(userId, friendId);
      if (!error) {
        // Cập nhật state local ngay lập tức để đổi text button mà không cần load lại cả trang
        await loadFriendships();
        // Vẫn gọi onSuccess để bên ngoài (SquadPage) biết và update số lượng bạn bè nếu cần khi modal đóng
        onSuccess();
      } else {
        alert('Không thể gửi lời mời kết bạn.');
      }
    } catch (err) {
      console.error('Connect failed:', err);
    }
  };

  const getFriendStatus = (friendId: string) => {
    const f = friendships.find(fs => 
      (fs.user_id === userId && fs.friend_id === friendId) || 
      (fs.friend_id === userId && fs.user_id === friendId)
    );
    if (!f) return 'none';
    if (f.status === 'accepted') return 'friend';
    if (f.user_id === userId) return 'sent';
    return 'received';
  };

  const getInitials = (p: any) => {
    if (p.last_name && p.first_name) return (p.last_name[0] + p.first_name[0]).toUpperCase();
    if (p.display_name) {
      const parts = p.display_name.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
      return p.display_name.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  if (!open) return null;

  return (
    <div className="scrim" onClick={onClose} style={{ zIndex: 300 }}>
      <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-head" style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: '18px' }}>Thêm bạn bè mới</h3>
          <button className="close" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <form 
              onSubmit={handleSearch} 
              style={{ 
                display: 'flex', 
                gap: '12px', 
                alignItems: 'center'
              }}
            >
              <div style={{ 
                flex: 1, 
                background: 'var(--bg-2)', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center',
                padding: '0 16px',
                border: '1px solid var(--line-2)',
                transition: 'all 0.2s'
              }}>
                <Icon name="search" size={20} style={{ color: 'var(--t3)' }} />
                <input 
                  type="text" 
                  placeholder="Nhập ID, email hoặc tên..." 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  style={{ 
                    flex: 1,
                    padding: '14px 10px',
                    background: 'transparent',
                    border: 0,
                    outline: 0,
                    fontSize: '15px'
                  }}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  padding: '0 24px', 
                  height: '50px', 
                  borderRadius: '12px',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(124, 77, 255, 0.2)'
                }} 
                disabled={loading}
              >
                {loading ? '...' : 'Tìm kiếm'}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto', padding: '2px' }}>
            {results.length > 0 ? results.map(p => {
              const status = getFriendStatus(p.id);
              return (
                <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--line-2)', background: 'var(--card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className="avatar md" style={{ width: '44px', height: '44px', background: '#6938E8', color: '#fff', fontSize: '15px', fontWeight: 800, flexShrink: 0 }}>
                      {getInitials(p)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="tx-name" style={{ fontSize: '15px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.display_name || 'Vô danh'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--purple-600)', fontWeight: 600, background: 'var(--purple-50)', padding: '1px 6px', borderRadius: '4px' }}>
                          ID: {p.tieugon_id || 'Chưa đặt'}
                        </span>
                        <span style={{ color: 'var(--t4)', fontSize: '12px' }}>•</span>
                        <span className="tx-note" style={{ fontSize: '11px', color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{p.email || 'Ẩn email'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ flexShrink: 0, marginLeft: '12px' }}>
                    {status === 'none' && (
                      <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--purple-300)', color: 'var(--purple-700)', padding: '6px 12px' }} onClick={() => handleConnect(p.id)}>
                        <Icon name="plus" size={12} />
                        <span>Kết bạn</span>
                      </button>
                    )}
                    {status === 'sent' && (
                      <button className="btn btn-outline btn-sm" disabled style={{ background: 'var(--bg-2)', borderColor: 'transparent', color: 'var(--t3)', padding: '6px 12px' }}>
                        <Icon name="check" size={12} />
                        <span>Đã gửi</span>
                      </button>
                    )}
                    {status === 'friend' && (
                      <button className="btn btn-secondary btn-sm" disabled style={{ background: 'var(--green-2)', color: '#059669', borderColor: 'transparent', padding: '6px 12px' }}>
                        <Icon name="users" size={12} />
                        <span>Bạn bè</span>
                      </button>
                    )}
                    {status === 'received' && (
                      <button className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }} onClick={() => alert('Vào thông báo để chấp nhận')}>
                        <span>Chấp nhận</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            }) : hasSearched && !loading ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--bg-2)', borderRadius: '16px' }}>
                <Icon name="search" size={40} style={{ marginBottom: '16px', opacity: 0.1 }} />
                <p style={{ color: 'var(--t2)', fontWeight: 700, fontSize: '16px' }}>Không tìm thấy kết quả</p>
                <p style={{ color: 'var(--t3)', fontSize: '13px', marginTop: '6px' }}>Hãy thử tìm bằng ID chính xác nhé!</p>
              </div>
            ) : !loading && (
              <div style={{ textAlign: 'center', padding: '48px 20px', border: '2px dashed var(--line-2)', borderRadius: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--purple-50)', color: 'var(--purple-500)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                  <Icon name="users" size={24} />
                </div>
                <p style={{ color: 'var(--t2)', fontWeight: 600 }}>Bắt đầu kết nối</p>
                <p style={{ color: 'var(--t3)', fontSize: '12px', marginTop: '4px', maxWidth: '240px', margin: '4px auto 0' }}>Nhập ID hoặc email để tìm đồng đội.</p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-foot" style={{ background: 'var(--bg-2)', padding: '16px 24px' }}>
          <button className="btn btn-ghost" style={{ width: '100%', fontWeight: 600 }} onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;
