'use client';

import React, { useState, useEffect, useRef } from 'react';
import Icon, { IconName } from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase/client';
import { addTransaction } from '@/lib/supabase/queries';

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ open, onClose, userId, onSuccess }) => {
  const [mode, setMode] = useState<'manual' | 'scan'>('manual');
  const [amount, setAmount] = useState<number>(0);
  const [catId, setCatId] = useState<string>('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanPreview, setScanPreview] = useState<string | null>(null);

  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchCats() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'expense');
      if (data) {
        setCategories(data);
        if (data.length > 0 && !catId) setCatId(data[0].id);
      }
    }
    if (open) fetchCats();
  }, [open, supabase, catId]);

  if (!open) return null;

  const fmt = (v: number) => v.toLocaleString();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => setScanPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setIsScanning(true);

    // Simulate AI processing delay
    setTimeout(() => {
      // Logic trích xuất dữ liệu giả lập (Mock data)
      // Trong thực tế, bạn sẽ gửi file lên Backend/Cloud Function để chạy OCR + AI (GPT-4o Vision)
      setAmount(150000);
      setNote('Cơm trưa (Trích xuất từ hoá đơn)');
      
      // Tìm danh mục "Ăn uống" nếu có
      const foodCat = categories.find(c => c.name.toLowerCase().includes('ăn'));
      if (foodCat) setCatId(foodCat.id);

      setIsScanning(false);
      setMode('manual'); // Chuyển sang màn hình manual để user verify
      alert('AI đã trích xuất thành công! Hãy kiểm tra lại thông tin.');
    }, 2500);
  };

  const handleSave = async () => {
    if (amount <= 0 || !catId) {
      alert('Vui lòng nhập số tiền và chọn danh mục.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await addTransaction({
        user_id: userId,
        category_id: catId,
        amount,
        type: 'expense',
        date: new Date(date).toISOString(),
        note
      });

      if (error) throw error;
      
      onSuccess();
      onClose();
      // Reset form
      setAmount(0);
      setNote('');
      setScanPreview(null);
    } catch (err) {
      console.error('Failed to save expense:', err);
      alert('Không thể lưu chi tiêu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scrim" onClick={onClose} style={{ zIndex: 400 }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Ghi chi tiêu mới</h3>
          <button className="close" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="seg" style={{ marginBottom: '24px', width: '100%', display: 'flex' }}>
            <button 
              className={mode === 'manual' ? 'active' : ''} 
              onClick={() => setMode('manual')}
              style={{ flex: 1 }}
            >
              Nhập thủ công
            </button>
            <button 
              className={mode === 'scan' ? 'active' : ''} 
              onClick={() => setMode('scan')}
              style={{ flex: 1 }}
            >
              Quét hóa đơn (AI)
            </button>
          </div>

          {mode === 'manual' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="field">
                <label className="label">Số tiền chi</label>
                <div className="amount-input">
                  <input 
                    type="text" 
                    value={amount ? fmt(amount) : ''} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setAmount(val ? parseInt(val, 10) : 0);
                    }} 
                    placeholder="0"
                    autoFocus 
                  />
                  <span className="unit">đ</span>
                </div>
              </div>

              <div className="field">
                <label className="label">Danh mục</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {categories.map(c => (
                    <button 
                      key={c.id} 
                      className={`chip ${catId === c.id ? 'active' : ''}`}
                      onClick={() => setCatId(c.id)}
                      type="button"
                    >
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="label">Ghi chú</label>
                <textarea 
                  className="input" 
                  placeholder="Bạn đã chi vào việc gì?" 
                  rows={2}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="label">Ngày giao dịch</label>
                <input 
                  type="date" 
                  className="input" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="dropzone" style={{ border: '2px dashed var(--line-2)', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', background: 'var(--bg-2)' }}>
              {isScanning ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                   <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid var(--purple-200)', borderTopColor: 'var(--purple-600)', animation: 'spin 1s linear infinite' }} />
                   <p style={{ fontWeight: 700, color: 'var(--purple-700)' }}>AI đang phân tích hoá đơn...</p>
                   <p style={{ fontSize: '12px', color: 'var(--t3)' }}>Vui lòng đợi trong giây lát</p>
                </div>
              ) : (
                <>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--purple-50)', color: 'var(--purple-500)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                    <Icon name="camera" size={24} />
                  </div>
                  <h5 style={{ fontSize: '15px', fontWeight: 700 }}>Tải lên ảnh hóa đơn</h5>
                  <p style={{ fontSize: '13px', color: 'var(--t3)', marginTop: '4px' }}>Hệ thống AI sẽ tự động trích xuất số tiền và danh mục.</p>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept="image/*" />
                  <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => fileInputRef.current?.click()}>
                    Chọn tệp
                  </button>
                </>
              )}

              {scanPreview && !isScanning && (
                <div style={{ marginTop: '20px', position: 'relative' }}>
                  <img src={scanPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--line-2)' }} />
                  <button onClick={() => setScanPreview(null)} style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--rose)', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'grid', placeItems: 'center', border: '2px solid #fff' }}>
                    <Icon name="x" size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading || isScanning}>
            {loading ? 'Đang lưu...' : 'Lưu chi tiêu'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AddExpenseModal;
