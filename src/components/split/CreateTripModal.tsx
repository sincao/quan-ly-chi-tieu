'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { addTrip, addTripMember } from '@/lib/supabase/queries';

interface CreateTripModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: (tripId: string) => void;
}

const CreateTripModal: React.FC<CreateTripModalProps> = ({ open, onClose, userId, onSuccess }) => {
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setTime('');
      setMembers([]);
      setNewMemberName('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      if (members.includes(newMemberName.trim()) || newMemberName.trim() === 'Bạn') {
         setError('Tên này có rồi nhen má!');
         return;
      }
      setMembers([...members, newMemberName.trim()]);
      setNewMemberName('');
      setError('');
    }
  };

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên chuyến đi nhen má!');
      return;
    }
    if (members.length === 0) {
      setError('Thêm ít nhất 1 người nữa để có gì mà chia chứ 😄');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // 1. Create the trip
      const { data: trip, error: tripError } = await addTrip({
        creator_id: userId,
        name: name.trim(),
        start_date: time.trim() || undefined
      });

      if (tripError) throw tripError;

      if (trip) {
        // 2. Add all members (Wait for all to finish to ensure consistency)
        const memberPromises = members.map(nickname => 
          addTripMember({
            trip_id: trip.id,
            nickname: nickname
          })
        );
        
        await Promise.all(memberPromises);
        
        onSuccess(trip.id);
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to create trip:', err);
      setError(err.message || 'Có lỗi gì đó rồi, thử lại sau nhen má!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scrim" onClick={onClose} style={{ zIndex: 500 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-head">
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Tạo chuyến đi mới</h3>
          <button className="close" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>

        <div className="modal-body" style={{ padding: '24px 32px', textAlign: 'left' }}>
          <div className="field" style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label className="label" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block', color: 'var(--ink)', textAlign: 'left' }}>Tên chuyến đi</label>
            <input
              type="text"
              placeholder="VD: Phú Quốc 4N3Đ, Đà Nẵng team building..."
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              style={{
                borderRadius: '10px',
                border: '1.5px solid #F0F0F3',
                padding: '10px 14px',
                fontSize: '14px',
                width: '100%',
                outline: 'none',
                textAlign: 'left'
              }}
              autoFocus
            />
          </div>

          <div className="field" style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label className="label" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block', color: 'var(--ink)', textAlign: 'left' }}>
              Thời gian <span style={{ fontWeight: 400, color: 'var(--t3)' }}>(tuỳ chọn)</span>
            </label>
            <input
              type="text"
              placeholder="VD: 15 - 18/06/2026"
              value={time}
              onChange={e => setTime(e.target.value)}
              style={{
                borderRadius: '10px',
                border: '1.5px solid #F0F0F3',
                padding: '10px 14px',
                fontSize: '14px',
                width: '100%',
                outline: 'none',
                textAlign: 'left'
              }}
            />
          </div>

          <div className="field" style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label className="label" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', display: 'block', color: 'var(--ink)', textAlign: 'left' }}>
              Thành viên ({members.length + 1})
            </label>
            
            <div style={{ display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
               <div style={{ 
                 display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', 
                 borderRadius: '20px', background: '#fff', border: '1.5px solid var(--purple-200)',
                 color: 'var(--purple-700)', fontWeight: 700, fontSize: '12px'
               }}>
                  <span>Bạn</span>
               </div>
               
               {members.map((m, i) => (
                 <div key={i} style={{ 
                   display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
                   borderRadius: '20px', background: '#F5F5F7', border: '1.5px solid #E0E0E0',
                   fontSize: '12px', fontWeight: 600
                 }}>
                    <span>{m}</span>
                    <button onClick={() => handleRemoveMember(i)} style={{ border: 'none', background: 'none', color: '#999', cursor: 'pointer', padding: 0, display: 'flex' }}>
                       <Icon name="x" size={12} />
                    </button>
                 </div>
               ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
              <input
                type="text"
                placeholder="Tên thành viên..."
                value={newMemberName}
                onChange={e => { setNewMemberName(e.target.value); setError(''); }}
                onKeyPress={e => e.key === 'Enter' && handleAddMember()}
                style={{
                  borderRadius: '10px',
                  border: '1.5px solid #F0F0F3',
                  padding: '10px 14px',
                  fontSize: '13px',
                  flex: 1,
                  outline: 'none',
                  textAlign: 'left'
                }}
              />
              <button 
                className="btn btn-outline" 
                onClick={handleAddMember}
                type="button"
                style={{ borderRadius: '10px', padding: '0 16px', fontWeight: 700, border: '1.5px solid #F0F0F3', fontSize: '13px' }}
              >
                <Icon name="plus" size={14} />
                <span>Thêm</span>
              </button>
            </div>
          </div>
          
          <div style={{ minHeight: '18px', padding: '2px 0', textAlign: 'left' }}>
            {error ? (
              <p style={{ color: 'var(--rose)', fontSize: '12px', margin: 0, textAlign: 'left' }}>{error}</p>
            ) : (
              <p style={{ color: 'var(--t3)', fontSize: '12px', margin: 0, opacity: 0.8, textAlign: 'left' }}>
                Thêm ít nhất 1 người nữa để có gì mà chia 😄
              </p>
            )}
          </div>
        </div>

        <div className="modal-foot" style={{ padding: '16px 24px', borderTop: '1px solid #F0F0F3', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ borderRadius: '10px', padding: '10px 20px', fontWeight: 700, fontSize: '14px' }}>Huỷ</button>
          <button 
            className="btn btn-primary" 
            onClick={handleCreate} 
            disabled={loading}
            style={{ 
              borderRadius: '10px', 
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #7C4DFF 0%, #6938E8 100%)',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '14px',
              boxShadow: '0 4px 15px rgba(124, 77, 255, 0.3)'
            }}
          >
            {loading ? 'Đang tạo...' : (
              <>
                <Icon name="check" size={16} />
                <span>Tạo chuyến đi</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal {
          animation: modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default CreateTripModal;
