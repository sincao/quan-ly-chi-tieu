'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase/client';
import { getSquadData, getFriendships, getAllProfiles } from '@/lib/supabase/queries';

interface CreateDuelModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

const DUEL_TEMPLATES = [
  { id: 'campaign_savings', label: 'Vua Tiết Kiệm', desc: 'Ai tích lũy được nhiều tiền tiết kiệm hơn trong chiến dịch này?', defaultStake: '1 ly trà sữa' },
  { id: 'campaign_violations', label: 'Kỷ Luật Thép', desc: 'Ai vi phạm (tiêu quá mức) ít lần hơn?', defaultStake: 'Người thua nấu cơm' },
  { id: 'campaign_streaks', label: 'Chiến Binh Bền Bỉ', desc: 'Ai duy trì chuỗi ngày tiết kiệm dài hơn?', defaultStake: 'Kẻ thắng làm vua' },
];

const CreateDuelModal: React.FC<CreateDuelModalProps> = ({ open, onClose, userId, onSuccess }) => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [availableOpponents, setAvailableOpponents] = useState<any[]>([]);
  const [opponentId, setOpponentId] = useState('');
  const [type, setType] = useState('campaign_savings');
  const [stake, setStake] = useState('');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open, userId]);

  async function loadInitialData() {
    setInitialLoading(true);
    try {
      // 1. Lấy danh sách chiến dịch đã tham gia
      const squad = await getSquadData(userId);
      const joined = squad.campaigns.filter((c: any) => c.isJoined);
      setCampaigns(joined);
      
      if (joined.length > 0) {
        setSelectedCampaignId(joined[0].id);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setInitialLoading(false);
    }
  }

  // Cập nhật danh sách đối thủ khi đổi chiến dịch
  useEffect(() => {
    if (selectedCampaignId) {
      updateOpponents(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  async function updateOpponents(campId: string) {
    try {
      const camp = campaigns.find(c => c.id === campId);
      if (!camp) return;

      // Lấy danh sách bạn bè
      const { data: friends } = await getFriendships(userId);
      const friendIds = friends?.map((f: any) => f.user_id === userId ? f.friend_id : f.user_id) || [];

      // Lọc thành viên chiến dịch mà cũng là bạn bè
      const { profiles: allProfs } = await getAllProfiles();
      const membersInCamp = camp.members?.map((m: any) => m.user_id) || [];
      
      const filtered = (allProfs || []).filter((p: any) => 
        p.id !== userId && 
        membersInCamp.includes(p.id) && 
        friendIds.includes(p.id)
      );

      setAvailableOpponents(filtered);
      if (filtered.length > 0) setOpponentId(filtered[0].id);
      else setOpponentId('');
    } catch (err) {
      console.error('Failed to update opponents:', err);
    }
  }

  useEffect(() => {
    const template = DUEL_TEMPLATES.find(t => t.id === type);
    if (template) setStake(template.defaultStake);
  }, [type]);

  if (!open) return null;

  const handleSave = async () => {
    if (!selectedCampaignId) {
      alert('Bạn phải tham gia ít nhất một chiến dịch.');
      return;
    }
    if (!opponentId) {
      alert('Vui lòng chọn một người bạn trong cùng chiến dịch để thách đấu.');
      return;
    }

    setLoading(true);
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const template = DUEL_TEMPLATES.find(t => t.id === type);
      const camp = campaigns.find(c => c.id === selectedCampaignId);

      const { error } = await supabase
        .from('duels')
        .insert([{
          title: `${template?.label}: ${camp?.name}`,
          challenge_type: type,
          campaign_id: selectedCampaignId,
          creator_id: userId,
          opponent_id: opponentId,
          stake,
          end_date: endDate.toISOString(),
          status: 'active'
        }]);

      if (error) throw error;
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create duel:', err);
      alert('Không thể tạo trận đấu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scrim" onClick={onClose} style={{ zIndex: 300 }}>
      <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Thử thách đối đầu mới</h3>
          <button className="close" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Icon name="info" size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ color: 'var(--t2)', fontWeight: 600 }}>Bạn chưa tham gia chiến dịch nào</p>
              <p style={{ fontSize: '13px', color: 'var(--t3)', marginTop: '4px' }}>Hãy tham gia một chiến dịch tiết kiệm trước khi thách đấu bạn bè.</p>
            </div>
          ) : (
            <>
              <div className="field">
                <label className="label">Chọn Chiến dịch so tài</label>
                <select 
                  className="select" 
                  value={selectedCampaignId} 
                  onChange={e => setSelectedCampaignId(e.target.value)}
                >
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
                <p className="help">Bạn chỉ có thể thách đấu trong các chiến dịch mình đã tham gia.</p>
              </div>

              <div className="field">
                <label className="label">Chọn Đối thủ</label>
                {availableOpponents.length > 0 ? (
                  <select className="select" value={opponentId} onChange={e => setOpponentId(e.target.value)}>
                    {availableOpponents.map(p => (
                      <option key={p.id} value={p.id}>{p.display_name} ({p.tieugon_id})</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ padding: '12px', background: 'var(--bg-2)', borderRadius: '8px', border: '1px solid var(--line-2)', color: 'var(--rose)', fontSize: '13px' }}>
                    Chưa có người bạn nào của bạn tham gia chiến dịch này.
                  </div>
                )}
              </div>

              <div className="field">
                <label className="label">Hình thức thách đấu</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {DUEL_TEMPLATES.map(t => (
                    <button 
                      key={t.id} 
                      className={`chip ${type === t.id ? 'active' : ''}`}
                      onClick={() => setType(t.id)}
                      style={{ padding: '12px 8px', height: 'auto', whiteSpace: 'normal', textAlign: 'center', lineHeight: '1.2' }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <p className="help" style={{ marginTop: '8px' }}>{DUEL_TEMPLATES.find(t => t.id === type)?.desc}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="field">
                  <label className="label">Phần thưởng (Kèo)</label>
                  <input type="text" className="input" value={stake} onChange={e => setStake(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label">Thời hạn (ngày)</label>
                  <input type="number" className="input" value={days} onChange={e => setDays(parseInt(e.target.value, 10))} />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={loading || campaigns.length === 0 || availableOpponents.length === 0}
          >
            {loading ? 'Đang tạo...' : 'Gửi lời thách đấu'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDuelModal;
