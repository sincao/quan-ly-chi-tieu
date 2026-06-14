'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { addDish, updateDish } from '@/lib/supabase/queries';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface AddDishModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: (id?: string) => void;
  editDish?: any;
}

const EMOJI_OPTIONS = ['🍜', '🥤', '🥖', '🍲', '🍚', '🥟', '🥗', '🥩', '🍰', '☕', '🍦', '🍕', '🍔', '🌮', '🍣'];

const AddDishModal: React.FC<AddDishModalProps> = ({ open, onClose, userId, onSuccess, editDish }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🍜');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (editDish) {
        setName(editDish.name);
        setEmoji(editDish.emoji || '🍜');
      } else {
        setName('');
        setEmoji('🍜');
      }
      setError('');
    }
  }, [open, editDish]);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t('validation.required'));
      return;
    }
    setLoading(true);
    try {
      let result;
      if (editDish) {
        result = await updateDish(editDish.id, { name, emoji });
      } else {
        result = await addDish(userId, { name, emoji });
      }
      
      if (result.error) throw result.error;
      
      onSuccess(result.data?.id);
      onClose();
    } catch (err: any) {
      console.error('handleSave error:', err);
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scrim" onClick={onClose} style={{ zIndex: 400 }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{editDish ? t('common.edit') : t('restaurants.add_dish')}</h3>
          <button className="close" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="field" style={{ marginBottom: '20px' }}>
            <label className="label">Biểu tượng</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  className={`chip ${emoji === e ? 'active' : ''}`}
                  onClick={() => setEmoji(e)}
                  style={{ fontSize: '20px', width: '44px', height: '44px', display: 'grid', placeItems: 'center' }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="label">Tên món ăn</label>
            <input
              type="text"
              className={`input ${error ? 'error' : ''}`}
              placeholder="Ví dụ: Bún chả, Trà sữa..."
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              autoFocus
            />
            {error && <span style={{ color: 'var(--rose)', fontSize: '12px', marginTop: '4px' }}>{error}</span>}
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDishModal;
