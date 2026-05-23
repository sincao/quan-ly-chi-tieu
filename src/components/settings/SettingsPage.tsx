'use client';

import React, { useState, useEffect, useRef } from 'react';
import Icon, { IconName } from '@/components/ui/Icon';
import { logout } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/client';
import { createMonthlyBudget, updateProfile, createCategory, deleteCategory } from '@/lib/supabase/queries';
import { User } from '@supabase/supabase-js';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useLanguage } from '@/components/providers/LanguageProvider';

const SettingsPage: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const { locale, setLocale, t } = useLanguage();
  const [active, setActive] = useState('profile');
  const [budget, setBudget] = useState<number>(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [tieugonId, setTieugonId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const sections = [
    { id: 'profile',   label: t('settings.profile'),           icon: 'user' },
    { id: 'budget',    label: t('settings.budget'), icon: 'piggy' },
    { id: 'general',   label: t('settings.general'),   icon: 'settings' },
  ];

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setTieugonId(data.tieugon_id || '');
        setAvatarUrl(data.avatar_url || null);
      }
    }
    loadProfile();
  }, [user.id]);

  useEffect(() => {
    async function loadBudgetAndCats() {
      if (active === 'budget') {
        const now = new Date();
        const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const { data: bData } = await supabase.from('budgets').select('amount_limit').eq('user_id', user.id).eq('month_year', firstDay).maybeSingle();
        if (bData) setBudget(Number(bData.amount_limit));
        const { data: cData } = await supabase.from('categories').select('*').order('name');
        if (cData) setCategories(cData);
      }
    }
    loadBudgetAndCats();
  }, [active, user.id, supabase]);

  const handleLogout = async () => {
    setConfirm({
      open: true,
      title: t('common.logout'),
      message: locale === 'vi' ? 'Bạn có chắc chắn muốn đăng xuất không?' : 'Are you sure you want to logout?',
      type: 'danger',
      onConfirm: async () => { await logout(); onLogout(); }
    });
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await updateProfile(user.id, {
        first_name: firstName,
        last_name: lastName,
        tieugon_id: tieugonId,
        display_name: `${lastName} ${firstName}`.trim(),
        avatar_url: avatarUrl
      });
      if (error) throw error;
      setMessage({ type: 'success', text: t('common.success') });
    } catch (err: any) {
      if (err.code === '23505') setMessage({ type: 'error', text: 'ID already taken' });
      else setMessage({ type: 'error', text: t('common.error') });
    } finally { setLoading(false); }
  };

  const handleSaveBudget = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await createMonthlyBudget(user.id, budget);
      if (error) throw error;
      setMessage({ type: 'success', text: t('common.success') });
    } catch (err) {
      setMessage({ type: 'error', text: t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    const name = prompt(locale === 'vi' ? 'Nhập tên danh mục mới:' : 'Enter category name:');
    if (!name) return;
    setLoading(true);
    try {
      const { data, error } = await createCategory({ name, icon: 'list', color: '#7C4DFF', type: 'expense' });
      if (error) throw error;
      if (data) setCategories([...categories, ...data]);
      setMessage({ type: 'success', text: t('common.success') });
    } catch (err) { setMessage({ type: 'error', text: t('common.error') }); }
    finally { setLoading(false); }
  };

  const handleDeleteCategory = async (id: string) => {
    setConfirm({
      open: true,
      title: t('common.delete'),
      message: locale === 'vi' ? 'Bạn có chắc chắn muốn xóa không?' : 'Are you sure you want to delete?',
      type: 'danger',
      onConfirm: async () => {
        setLoading(true);
        try {
          const { error } = await deleteCategory(id);
          if (error) throw error;
          setCategories(categories.filter(c => c.id !== id));
        } catch (err) { setMessage({ type: 'error', text: t('common.error') }); }
        finally { setLoading(false); setConfirm(c => ({ ...c, open: false })); }
      }
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
    } catch (err) { setMessage({ type: 'error', text: 'Upload failed' }); }
    finally { setLoading(false); }
  };

  const getInitials = () => {
    if (firstName && lastName) return (lastName[0] + firstName[0]).toUpperCase();
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    return user.email?.substring(0, 2).toUpperCase() || '??';
  };

  return (
    <div className="main-inner">
      <div className="page-head">
        <div>
          <h1>{t('nav.settings')}</h1>
          <p className="sub">{t('settings.general')}</p>
        </div>
      </div>

      <div className="settings-shell">
        <div className="settings-nav">
          {sections.map(s => (
            <button key={s.id} className={active === s.id ? 'active' : ''} onClick={() => { setActive(s.id); setMessage(null); }}>
              <Icon name={s.icon as IconName} size={14} />
              <span>{s.label}</span>
            </button>
          ))}
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--line)' }}>
            <button onClick={handleLogout} style={{ color: 'var(--rose)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', width: '100%' }}>
              <Icon name="log-out" size={14} />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </div>

        <div className="settings-content">
          {message && (
            <div className={`badge ${message.type === 'error' ? 'rose' : 'green'}`} style={{ padding: '10px', borderRadius: '8px', marginBottom: '12px', width: '100%' }}>
              {message.text}
            </div>
          )}

          {active === 'profile' && (
            <div className="card">
              <div className="settings-section">
                <h4>{t('settings.public_profile')}</h4>
                <p className="desc">{t('settings.profile_desc')}</p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div className="avatar xl" style={{ overflow: 'hidden', background: '#6938E8', color: '#fff' }}>
                  {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials()}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarChange} style={{ display: 'none' }} accept="image/*" />
                  <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                    {loading ? t('common.loading') : t('settings.change_photo')}
                  </button>
                  <button className="btn btn-ghost" style={{ color: 'var(--rose)' }} onClick={() => setAvatarUrl(null)}>{t('settings.remove_photo')}</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="field">
                  <label className="label">ID</label>
                  <input 
                    type="text" className="input" value={tieugonId} 
                    onChange={e => setTieugonId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} 
                    placeholder="username" 
                  />
                  <p className="help">{t('settings.id_help')}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="field">
                    <label className="label">{t('settings.last_name')}</label>
                    <input type="text" className="input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nguyen" />
                  </div>
                  <div className="field">
                    <label className="label">{t('settings.first_name')}</label>
                    <input type="text" className="input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="An" />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Email</label>
                  <input type="text" className="input" value={user.email} disabled style={{ opacity: 0.6 }} />
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleSaveProfile} disabled={loading}>
                  {loading ? t('common.saving') : t('common.save_profile')}
                </button>
              </div>
            </div>
          )}

          {active === 'budget' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="card">
                <div className="settings-section">
                  <h4>{t('settings.budget_mgmt')}</h4>
                  <p className="desc">{t('settings.budget_desc')}</p>
                </div>

                <div className="field" style={{ marginTop: 20 }}>
                  <label className="label">{t('settings.budget_label')} {new Date().getMonth() + 1}</label>
                  <div className="amount-input">
                    <input 
                      type="text" value={budget.toLocaleString()} 
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setBudget(val ? parseInt(val, 10) : 0);
                      }}
                    />
                    <span className="unit">đ</span>
                  </div>
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={handleSaveBudget} disabled={loading}>
                    {loading ? t('common.saving') : t('common.save_budget')}
                  </button>
                </div>
              </div>

              <div className="card flush">
                <div className="card-h">
                  <div>
                    <h3>{t('settings.categories_title')}</h3>
                    <div className="sub">{t('settings.categories_sub')}</div>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={handleAddCategory}>
                    <Icon name="plus" size={14} />
                    <span>{t('common.add')}</span>
                  </button>
                </div>
                <div className="card-body tight">
                  <table className="tbl">
                    <tbody>
                      {categories.map(c => (
                        <tr key={c.id}>
                          <td>
                            <div className="tx-cell">
                              <div className="tx-cat-ico" style={{ background: c.color + '20', color: c.color }}>
                                <Icon name={(c.icon as any) || 'list'} size={14} />
                              </div>
                              <div className="tx-name">{c.name}</div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${c.type === 'expense' ? 'gray' : 'green'}`}>
                              {c.type === 'expense' ? t('dashboard.spent') : t('dashboard.savings')}
                            </span>
                          </td>
                          <td>
                            <div className="tbl-actions">
                              <button className="icon-btn sm" onClick={() => handleDeleteCategory(c.id)} title={t('common.delete')}>
                                <Icon name="trash" size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {active === 'general' && (
            <div className="card">
              <h4>{t('settings.general')}</h4>
              <div className="settings-row" style={{ marginTop: 20 }}>
                <div className="label-col">
                  <div className="label-row">{t('settings.language')}</div>
                </div>
                <div className="control-col">
                  <div className="seg">
                    <button className={locale === 'vi' ? 'active' : ''} onClick={() => setLocale('vi')}>Tiếng Việt</button>
                    <button className={locale === 'en' ? 'active' : ''} onClick={() => setLocale('en')}>English</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        open={confirm.open} title={confirm.title} message={confirm.message} type={confirm.type}
        onConfirm={confirm.onConfirm} onClose={() => setConfirm(c => ({ ...c, open: false }))}
      />
    </div>
  );
};

export default SettingsPage;
