'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase/client';
import { getDashboardData } from '@/lib/supabase/queries';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO, format } from 'date-fns';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface TransactionsPageProps {
  onAdd: () => void;
  refreshKey?: number;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ onAdd, refreshKey = 0 }) => {
  const { t, locale } = useLanguage();
  const [q, setQ] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  
  // Custom range state
  const [isCustomModalOpen, setCustomModalOpen] = useState(false);
  const [tempStart, setTempStart] = useState<string>('');
  const [tempEnd, setTempEnd] = useState<string>('');
  const [appliedStart, setAppliedStart] = useState<string>('');
  const [appliedEnd, setAppliedEnd] = useState<string>('');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
  }, [refreshKey]);

  const transactions = data?.transactions || [];
  const categories = data?.allCategories || [];

  const filtered = transactions.filter((t: any) => {
    const note = t.note || '';
    const catName = t.categories?.name || '';
    const matchQ = note.toLowerCase().includes(q.toLowerCase()) || catName.toLowerCase().includes(q.toLowerCase());
    
    // Filter by Category
    const matchCat = selectedCat === 'all' || t.category_id === selectedCat;
    
    // Filter by Period
    const tDate = parseISO(t.date);
    const now = new Date();
    let matchPeriod = true;
    
    if (selectedPeriod === 'week') {
      matchPeriod = isWithinInterval(tDate, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
    } else if (selectedPeriod === 'month') {
      matchPeriod = isWithinInterval(tDate, { start: startOfMonth(now), end: endOfMonth(now) });
    } else if (selectedPeriod === 'year') {
      matchPeriod = isWithinInterval(tDate, { start: startOfYear(now), end: endOfYear(now) });
    } else if (selectedPeriod === 'custom') {
      if (appliedStart && appliedEnd) {
        matchPeriod = isWithinInterval(tDate, { start: parseISO(appliedStart), end: parseISO(appliedEnd) });
      } else if (appliedStart) {
        matchPeriod = tDate >= parseISO(appliedStart);
      } else if (appliedEnd) {
        matchPeriod = tDate <= parseISO(appliedEnd);
      }
    }

    return matchQ && matchCat && matchPeriod;
  });

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      setCustomModalOpen(true);
    } else {
      setSelectedPeriod(val);
      setAppliedStart('');
      setAppliedEnd('');
    }
  };

  const handleApplyCustom = () => {
    setAppliedStart(tempStart);
    setAppliedEnd(tempEnd);
    setSelectedPeriod('custom');
    setCustomModalOpen(false);
  };

  const handleResetFilters = () => {
    setQ('');
    setSelectedCat('all');
    setSelectedPeriod('month');
    setAppliedStart('');
    setAppliedEnd('');
    setTempStart('');
    setTempEnd('');
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = locale === 'vi' ? ['Ngày', 'Tên/Ghi chú', 'Danh mục', 'Số tiền', 'Loại'] : ['Date', 'Note', 'Category', 'Amount', 'Type'];
    const rows = filtered.map((t: any) => [
      new Date(t.date).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US'),
      t.note || t.categories?.name || (locale === 'vi' ? 'Chi tiêu' : 'Expense'),
      t.categories?.name || (locale === 'vi' ? 'Khác' : 'Other'),
      t.amount,
      t.type === 'expense' ? (locale === 'vi' ? 'Chi tiêu' : 'Expense') : (locale === 'vi' ? 'Thu nhập' : 'Income')
    ]);
    const csvContent = [headers.join(','), ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Transactions_${format(new Date(), 'ddMMyyyy')}.csv`;
    link.click();
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('common.loading')}</div>;

  const isFiltered = q !== '' || selectedCat !== 'all' || selectedPeriod !== 'month' || appliedStart !== '';

  return (
    <div className="main-inner">
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
        
        <select 
          className="select" 
          value={selectedCat} 
          onChange={(e) => setSelectedCat(e.target.value)}
          style={{ height: '38px', fontSize: '13px', fontWeight: 500 }}
        >
          <option value="all">{t('transactions.all_categories')}</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select 
          className="select" 
          value={selectedPeriod} 
          onChange={handlePeriodChange}
          style={{ height: '38px', fontSize: '13px', fontWeight: 500 }}
        >
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
        <table className="tbl">
          <thead>
            <tr>
              <th className="checkbox-col" style={{ width: '40px', textAlign: 'center' }}>
                <input type="checkbox" className="checkbox" />
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
                  <input type="checkbox" className="checkbox" />
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
                  <span className="badge gray" style={{ 
                    background: t_item.categories?.color ? `${t_item.categories.color}20` : undefined, 
                    color: t_item.categories?.color 
                  }}>
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
                    <button className="icon-btn sm"><Icon name="edit" size={14} /></button>
                    <button className="icon-btn sm"><Icon name="trash" size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--t3)' }}>
            <Icon name="search" size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>{t('transactions.empty')}</p>
          </div>
        )}
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
    </div>
  );
};

export default TransactionsPage;
