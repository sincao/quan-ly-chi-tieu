'use client';

import React, { useState, useEffect, useRef } from 'react';
import Icon, { IconName } from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase/client';
import { addTransaction } from '@/lib/supabase/queries';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ open, onClose, userId, onSuccess }) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'manual' | 'scan'>('manual');
  const [amount, setAmount] = useState<number>(0);
  const [catId, setCatId] = useState<string>('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchCats() {
      const { data } = await supabase.from('categories').select('*').eq('type', 'expense');
      if (data) {
        setCategories(data);
        if (data.length > 0 && !catId) setCatId(data[0].id);
      }
    }
    if (open) { fetchCats(); setErrors({}); }
  }, [open, supabase, catId]);

  if (!open) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setScanPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setIsScanning(true);
    setTimeout(() => {
      setAmount(150000);
      setNote('AI Scanned Receipt');
      const foodCat = categories.find(c => c.name.toLowerCase().includes('ăn'));
      if (foodCat) setCatId(foodCat.id);
      setIsScanning(false);
      setMode('manual');
    }, 2500);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!amount || amount <= 0) e.amount = t('validation.amount_positive');
    if (!catId) e.catId = t('validation.required');
    if (!date) e.date = t('validation.required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await addTransaction({ user_id: userId, category_id: catId, amount, type: 'expense', date: new Date(date).toISOString(), note });
      if (error) throw error;
      onSuccess();
      onClose();
      setAmount(0);
      setNote('');
      setErrors({});
    } catch (err) {
      alert(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scrim" onClick={onClose} style={{ zIndex: 400 }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{t('dashboard.record_expense')}</h3>
          <button className="close" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="seg" style={{ marginBottom: '24px', width: '100%', display: 'flex' }}>
            <button className={mode === 'manual' ? 'active' : ''} onClick={() => setMode('manual')} style={{ flex: 1 }}>{t('common.add')}</button>
            <button className={mode === 'scan' ? 'active' : ''} onClick={() => setMode('scan')} style={{ flex: 1 }}>Scan (AI)</button>
          </div>

          <div className="field" style={{ marginBottom: '20px' }}>
            <label className="label">{t('transactions.date')}</label>
            <input
              type="date"
              className={`input${errors.date ? ' error' : ''}`}
              value={date}
              onChange={e => { setDate(e.target.value); if (errors.date) setErrors(prev => ({ ...prev, date: '' })); }}
            />
            {errors.date && <span className="field-error">⚠ {errors.date}</span>}
          </div>

          {mode === 'manual' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="field">
                <label className="label">{t('transactions.amount')}</label>
                <div className={`amount-input${errors.amount ? ' error' : ''}`}>
                  <input
                    type="text"
                    value={amount || ''}
                    onChange={e => { setAmount(Number(e.target.value.replace(/\D/g, ''))); if (errors.amount) setErrors(prev => ({ ...prev, amount: '' })); }}
                    placeholder="0"
                    autoFocus
                  />
                  <span className="unit">đ</span>
                </div>
                {errors.amount && <span className="field-error">⚠ {errors.amount}</span>}
              </div>
              <div className="field">
                <label className="label">{t('transactions.category')}</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      className={`chip ${catId === c.id ? 'active' : ''}`}
                      onClick={() => { setCatId(c.id); if (errors.catId) setErrors(prev => ({ ...prev, catId: '' })); }}
                      type="button"
                    >
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
                {errors.catId && <span className="field-error">⚠ {errors.catId}</span>}
              </div>
              <div className="field">
                <label className="label">{t('transactions.note')}</label>
                <textarea className="input" placeholder="..." rows={2} value={note} onChange={e => setNote(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="dropzone" style={{ border: '2px dashed var(--line-2)', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', background: 'var(--bg-2)' }}>
              {isScanning ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid var(--purple-200)', borderTopColor: 'var(--purple-600)', animation: 'spin 1s linear infinite' }} />
                  <p>{t('common.loading')}</p>
                </div>
              ) : (
                <>
                  <Icon name="camera" size={24} />
                  <p style={{ marginTop: '8px' }}>Upload Receipt</p>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept="image/*" />
                  <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => fileInputRef.current?.click()}>{t('common.search')}</button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading || isScanning}>{t('common.save')}</button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;
