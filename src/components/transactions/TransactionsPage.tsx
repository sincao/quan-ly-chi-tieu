'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase/client';
import { getDashboardData, deleteTransaction, updateTransaction } from '@/lib/supabase/queries';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO, format } from 'date-fns';
import { useLanguage } from '@/components/providers/LanguageProvider';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface TransactionsPageProps {
  onAdd: () => void;
  refreshKey?: number;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ onAdd, refreshKey = 0 }) => {
  const { t, locale } = useLanguage();
  const [q, setQ] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [isCustomModalOpen, setCustomModalOpen] = useState(false);
  const [tempStart, setTempStart] = useState<string>('');
  const [tempEnd, setTempEnd] = useState<string>('');
  const [appliedStart, setAppliedStart] = useState<string>('');
  const [appliedEnd, setAppliedEnd] = useState<string>('');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [localRefresh, setLocalRefresh] = useState(0);

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

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const dbData = await getDashboardData(session.user.id);
        setData(dbData);
      }
      setLoading(false);
    }
    loadData();
  }, [refreshKey, localRefresh]);

  const transactions = data?.transactions || [];
  const categories = data?.allCategories || [];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setConfirm({
      open: true,
      title: t('transactions.confirm_delete_title'),
      message: selectedIds.length === 1 ? t('transactions.confirm_delete_msg') : `Bạn có chắc muốn xoá ${selectedIds.length} giao dịch đã chọn?`,
      type: 'danger',
      onConfirm: async () => {
        setLoading(true);
        try {
          await Promise.all(selectedIds.map(id => deleteTransaction(id)));
          setLocalRefresh(prev => prev + 1);
          setSelectedIds([]);
        } finally {
          setLoading(false);
          setConfirm(c => ({ ...c, open: false }));
        }
      }
    });
  };

  const handleEditSelected = () => {
    if (selectedIds.length !== 1) return;
    const target = transactions.find((t: any) => t.id === selectedIds[0]);
    if (target) handleEdit(target);
  };

  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const handleDelete = (id: string) => {
    setConfirm({
      open: true,
      title: t('transactions.confirm_delete_title'),
      message: t('transactions.confirm_delete_msg'),
      type: 'danger',
      onConfirm: async () => {
        const { error } = await deleteTransaction(id);
        if (!error) setLocalRefresh(prev => prev + 1);
        setConfirm(c => ({ ...c, open: false }));
      }
    });
  };

  const handleEdit = (t_item: any) => {
    setEditingTransaction({
      ...t_item,
      date: t_item.date.split('T')[0]
    });
  };

  const handleUpdate = async () => {
    if (!editingTransaction) return;
    const errs: Record<string, string> = {};
    if (!editingTransaction.amount || editingTransaction.amount <= 0) errs.amount = t('validation.amount_positive');
    if (!editingTransaction.date) errs.date = t('validation.required');
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return; }
    setEditErrors({});
    const { id, category_id, amount, type, date, note } = editingTransaction;
    const { error } = await updateTransaction(id, {
      category_id,
      amount,
      type,
      date: new Date(date).toISOString(),
      note
    });
    if (!error) {
      setLocalRefresh(prev => prev + 1);
      setEditingTransaction(null);
      setSelectedIds([]);
    }
  };

  const filtered = transactions.filter((t: any) => {
    const note = t.note || '';
    const catName = t.categories?.name || '';
    const matchQ = note.toLowerCase().includes(q.toLowerCase()) || catName.toLowerCase().includes(q.toLowerCase());
    const matchCat = selectedCat === 'all' || t.category_id === selectedCat;
    const tDate = parseISO(t.date);
    const now = new Date();
    let matchPeriod = true;
    if (selectedPeriod === 'week') matchPeriod = isWithinInterval(tDate, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
    else if (selectedPeriod === 'month') matchPeriod = isWithinInterval(tDate, { start: startOfMonth(now), end: endOfMonth(now) });
    else if (selectedPeriod === 'year') matchPeriod = isWithinInterval(tDate, { start: startOfYear(now), end: endOfYear(now) });
    else if (selectedPeriod === 'custom') {
      if (appliedStart && appliedEnd) matchPeriod = isWithinInterval(tDate, { start: parseISO(appliedStart), end: parseISO(appliedEnd) });
      else if (appliedStart) matchPeriod = tDate >= parseISO(appliedStart);
      else if (appliedEnd) matchPeriod = tDate <= parseISO(appliedEnd);
    }
    return matchQ && matchCat && matchPeriod;
  });

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') setCustomModalOpen(true);
    else { setSelectedPeriod(val); setAppliedStart(''); setAppliedEnd(''); }
  };

  const handleApplyCustom = () => { setAppliedStart(tempStart); setAppliedEnd(tempEnd); setSelectedPeriod('custom'); setCustomModalOpen(false); };
  const handleResetFilters = () => { setQ(''); setSelectedCat('all'); setSelectedPeriod('month'); setAppliedStart(''); setAppliedEnd(''); setTempStart(''); setTempEnd(''); };

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = locale === 'vi' ? ['Ngày', 'Tên/Ghi chú', 'Danh mục', 'Số tiền', 'Loại'] : ['Date', 'Note', 'Category', 'Amount', 'Type'];
    const rows = filtered.map((t: any) => [new Date(t.date).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US'), t.note || t.categories?.name || t('transactions.expense'), t.categories?.name || t('transactions.other'), t.amount, t.type === 'expense' ? t('transactions.expense') : t('transactions.income')]);
    const csvContent = [headers.join(','), ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `Transactions_${format(new Date(), 'ddMMyyyy')}.csv`; link.click();
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('common.loading')}</div>;

  const isFiltered = q !== '' || selectedCat !== 'all' || selectedPeriod !== 'month' || appliedStart !== '';

  return (
    <div className="main-inner" style={{ position: 'relative', paddingBottom: selectedIds.length > 0 ? '80px' : '0' }}>
      <div className="page-head">
        <div>
          <h1>{t('transactions.title')}</h1>
          <p className="sub">{t('transactions.sub_prefix')} {filtered.length} {t('transactions.sub_suffix')}</p>
        </div>
        <div className="page-head-actions">
          {isFiltered && (
            <button className="btn btn-ghost btn-sm" onClick={handleResetFilters} style={{ color: 'var(--rose)', fontWeight: 600 }}>
              <Icon name="x" size={14} />
              <span>{t('common.reset_filter')}</span>
            </button>
          )}
          <button className="btn btn-outline" onClick={handleExportCSV}>
            <Icon name="download" size={16} />
            <span>{t('transactions.export')}</span>
          </button>
          <button className="btn btn-primary" onClick={onAdd}>
            <Icon name="plus" size={16} />
            <span>{t('transactions.add')}</span>
          </button>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', padding: '16px 20px' }}>
        <div className="search-input" style={{ flex: 'none', width: '100%' }}>
          <Icon name="search" size={16} />
          <input 
            type="text" 
            placeholder={t('transactions.search_placeholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        
        <select className="select" value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} style={{ height: '38px', fontSize: '13px', fontWeight: 500 }}>
          <option value="all">{t('transactions.all_categories')}</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select className="select" value={selectedPeriod} onChange={handlePeriodChange} style={{ height: '38px', fontSize: '13px', fontWeight: 500 }}>
          <option value="week">{t('transactions.this_week')}</option>
          <option value="month">{t('transactions.this_month')}</option>
          <option value="year">{t('transactions.this_year')}</option>
          <option value="all">{t('transactions.all_time')}</option>
          <option value="custom">{t('transactions.custom_range')}</option>
        </select>
      </div>

      {selectedPeriod === 'custom' && appliedStart && (
        <div style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--purple-50)', color: 'var(--purple-700)', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
           <Icon name="calendar" size={12} />
           <span>{t('transactions.applied_time')}: {format(parseISO(appliedStart), 'dd/MM/yyyy')} {appliedEnd ? `- ${format(parseISO(appliedEnd), 'dd/MM/yyyy')}` : ''}</span>
           <button onClick={handleResetFilters} style={{ marginLeft: '4px', cursor: 'pointer', opacity: 0.7 }}><Icon name="x" size={10} /></button>
        </div>
      )}

      <div className="card flush">
        {/* DESKTOP TABLE */}
        <table className="tbl hidden md:table">
          <thead>
            <tr>
              <th className="checkbox-col" style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  className="checkbox" 
                  checked={selectedIds.length === filtered.length && filtered.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(filtered.map((t: any) => t.id));
                    else setSelectedIds([]);
                  }}
                />
              </th>
              <th>{t('transactions.title')}</th>
              <th>{t('transactions.category')}</th>
              <th className="num">{t('transactions.amount')}</th>
              <th>{t('transactions.date')}</th>
              <th>{t('transactions.note')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t_item: any) => (
              <tr key={t_item.id}>
                <td style={{ textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    className="checkbox" 
                    checked={selectedIds.includes(t_item.id)}
                    onChange={() => toggleSelect(t_item.id)}
                  />
                </td>
                <td>
                  <div className="tx-cell">
                    <div className={`tx-cat-ico ${t_item.categories?.icon || 'other'}`} style={{ background: t_item.categories?.color ? `${t_item.categories.color}20` : undefined, color: t_item.categories?.color }}>
                      <Icon name={(t_item.categories?.icon as any) || 'list'} size={14} />
                    </div>
                    <div className="tx-name">{t_item.note || t_item.categories?.name || (locale === 'vi' ? 'Chi tiêu' : 'Expense')}</div>
                  </div>
                </td>
                <td>
                  <span className="badge gray" style={{ background: t_item.categories?.color ? `${t_item.categories.color}20` : undefined, color: t_item.categories?.color }}>
                    {t_item.categories?.name || (locale === 'vi' ? 'Khác' : 'Other')}
                  </span>
                </td>
                <td className={`num ${t_item.type === 'expense' ? 'amt-spend' : 'amt-save'}`}>
                  {t_item.type === 'expense' ? '-' : '+'}{Number(t_item.amount).toLocaleString()}đ
                </td>
                <td>{new Date(t_item.date).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}</td>
                <td style={{ color: 'var(--t3)', fontSize: '12px' }}>{t_item.note}</td>
                <td>
                  <div className="tbl-actions">
                    <button className="icon-btn sm" onClick={() => handleEdit(t_item)}><Icon name="edit" size={14} /></button>
                    <button className="icon-btn sm" onClick={() => handleDelete(t_item.id)}><Icon name="trash" size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* MOBILE LIST */}
        <div className="block md:hidden">
          {filtered.map((t_item: any) => {
            const isSel = selectedIds.includes(t_item.id);
            return (
              <div key={t_item.id} onClick={() => toggleSelect(t_item.id)} style={{ padding: '16px 20px', borderBottom: '1px solid var(--line-2)', display: 'flex', gap: '14px', alignItems: 'center', background: isSel ? 'var(--color-purple-50)' : 'transparent', transition: 'background 0.2s' }}>
                <div style={{ 
                  width: '22px', 
                  height: '22px', 
                  borderRadius: '50%', 
                  border: isSel ? '2px solid var(--color-purple-600)' : '2px solid var(--line-2)', 
                  background: isSel ? 'var(--color-purple-600)' : 'transparent',
                  flexShrink: 0, 
                  display: 'grid',
                  placeItems: 'center',
                  transition: 'all 0.2s'
                }}>
                  {isSel && <Icon name="plus" size={12} style={{ color: '#fff', transform: 'rotate(45deg)' }} />}
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: t_item.categories?.color + '15', color: t_item.categories?.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name={t_item.categories?.icon || 'list'} size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t_item.note || t_item.categories?.name}
                    </div>
                    <div className={t_item.type === 'expense' ? 'amt-spend' : 'amt-save'} style={{ fontWeight: 800, fontSize: '15px' }}>
                      {t_item.type === 'expense' ? '-' : '+'}{Number(t_item.amount).toLocaleString()}đ
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '2px' }}>
                    {new Date(t_item.date).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')} · {t_item.categories?.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--t3)' }}>
            <Icon name="search" size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>{t('transactions.empty')}</p>
          </div>
        )}
      </div>

      {/* MOBILE CONTEXTUAL ACTION BAR */}
      <div className={`md:hidden ${selectedIds.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'} pointer-events-auto`} 
           style={{ 
             position: 'fixed', 
             bottom: '80px', 
             left: '20px', 
             right: '20px', 
             background: 'var(--card)', 
             borderRadius: '20px', 
             padding: '12px 20px', 
             boxShadow: '0 8px 32px rgba(0,0,0,0.15)', 
             border: '1px solid var(--line-2)',
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'space-between',
             zIndex: 100,
             transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
           }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSelectedIds([])} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-2)', display: 'grid', placeItems: 'center', color: 'var(--t2)' }}>
            <Icon name="x" size={16} />
          </button>
          <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-purple-700)' }}>{selectedIds.length} {t('common.selected')}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedIds.length === 1 && (
            <button className="btn btn-secondary btn-sm" onClick={handleEditSelected} style={{ borderRadius: '10px' }}>
              <Icon name="edit" size={14} />
              <span>Sửa</span>
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={handleDeleteSelected} style={{ borderRadius: '10px', background: 'var(--rose)', color: '#fff' }}>
            <Icon name="trash" size={14} />
            <span>Xoá</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Modal */}
      {isCustomModalOpen && (
        <div className="scrim" onClick={() => setCustomModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{t('transactions.custom_modal_title')}</h3>
              <button className="close" onClick={() => setCustomModalOpen(false)}><Icon name="x" size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="field">
                <label className="label">{t('common.from_date')}</label>
                <input type="date" className="input" value={tempStart} onChange={e => setTempStart(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">{t('common.to_date')}</label>
                <input type="date" className="input" value={tempEnd} onChange={e => setTempEnd(e.target.value)} />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setCustomModalOpen(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleApplyCustom} disabled={!tempStart && !tempEnd}>{t('common.apply')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="scrim" onClick={() => setEditingTransaction(null)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{t('transactions.edit_title')}</h3>
              <button className="close" onClick={() => setEditingTransaction(null)}><Icon name="x" size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
              <div className="seg" style={{ display: 'flex', width: '100%' }}>
                <button 
                  className={editingTransaction.type === 'expense' ? 'active' : ''} 
                  onClick={() => setEditingTransaction({...editingTransaction, type: 'expense'})}
                  style={{ flex: 1 }}
                >
                  {t('transactions.expense')}
                </button>
                <button 
                  className={editingTransaction.type === 'income' ? 'active' : ''} 
                  onClick={() => setEditingTransaction({...editingTransaction, type: 'income'})}
                  style={{ flex: 1 }}
                >
                  {t('transactions.income')}
                </button>
              </div>

              <div className="field">
                <label className="label">{t('transactions.amount')}</label>
                <div className={`amount-input${editErrors.amount ? ' error' : ''}`}>
                  <input
                    type="text"
                    value={editingTransaction.amount ? Number(editingTransaction.amount).toLocaleString() : ''}
                    onChange={e => { setEditingTransaction({...editingTransaction, amount: Number(e.target.value.replace(/\D/g, ''))}); if (editErrors.amount) setEditErrors(prev => ({ ...prev, amount: '' })); }}
                    placeholder="0"
                  />
                  <span className="unit">đ</span>
                </div>
                {editErrors.amount && <span className="field-error">⚠ {editErrors.amount}</span>}
              </div>

              <div className="field">
                <label className="label">{t('transactions.category')}</label>
                <select 
                  className="select" 
                  value={editingTransaction.category_id} 
                  onChange={e => setEditingTransaction({...editingTransaction, category_id: e.target.value})}
                >
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label">{t('transactions.date')}</label>
                <input
                  type="date"
                  className={`input${editErrors.date ? ' error' : ''}`}
                  value={editingTransaction.date}
                  onChange={e => { setEditingTransaction({...editingTransaction, date: e.target.value}); if (editErrors.date) setEditErrors(prev => ({ ...prev, date: '' })); }}
                />
                {editErrors.date && <span className="field-error">⚠ {editErrors.date}</span>}
              </div>

              <div className="field">
                <label className="label">{t('transactions.note')}</label>
                <input
                  type="text"
                  className="input"
                  value={editingTransaction.note}
                  onChange={e => setEditingTransaction({...editingTransaction, note: e.target.value})}
                  placeholder="..."
                />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setEditingTransaction(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleUpdate}>{t('common.save') || 'Lưu thay đổi'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onClose={() => setConfirm(c => ({ ...c, open: false }))}
        type={confirm.type}
      />
    </div>
  );
};

export default TransactionsPage;
