'use client';

import React, { useState, useEffect, useRef } from 'react';
import Icon, { IconName } from '@/components/ui/Icon';
import { logout } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/client';
import { createMonthlyBudget, updateProfile, createCategory, deleteCategory } from '@/lib/supabase/queries';
import { User } from '@supabase/supabase-js';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useLanguage } from '@/components/providers/LanguageProvider';

const SettingsPage: React.FC<{ user: User; onLogout: () => void; onProfileUpdate?: () => void }> = ({ user, onLogout, onProfileUpdate }) => {
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
        // We'll use the profile data for streak if available
        setProfileData(data);
      }
    }
    loadProfile();
  }, [user.id]);

  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    async function loadBudgetAndCats() {
      if (active === 'budget' || active === 'categories' || active === 'profile') {
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
    const fe: Record<string, string> = {};
    if (tieugonId && !/^[a-z0-9_]+$/.test(tieugonId)) fe.tieugonId = t('validation.id_format');
    if (Object.keys(fe).length > 0) { setFieldErrors(fe); return; }
    setFieldErrors({});
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
      setActive('profile');
      onProfileUpdate?.();
    } catch (err: any) {
      if (err.code === '23505') setFieldErrors({ tieugonId: locale === 'vi' ? 'ID này đã được dùng.' : 'This ID is already taken.' });
      else setMessage({ type: 'error', text: t('common.error') });
    } finally { setLoading(false); }
  };

  const handleSaveBudget = async () => {
    if (!budget || budget <= 0) { setFieldErrors({ budget: t('validation.amount_budget') }); return; }
    setFieldErrors({});
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await createMonthlyBudget(user.id, budget);
      if (error) throw error;
      setMessage({ type: 'success', text: t('common.success') });
      setActive('profile');
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
    } catch (err) { 
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: 'Upload failed' }); 
    }
    finally { setLoading(false); }
  };

  const getInitials = () => {
    if (firstName && lastName) return (lastName[0] + firstName[0]).toUpperCase();
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    return user.email?.substring(0, 2).toUpperCase() || '??';
  };

  return (
    <div className="main-inner">
      {/* DESKTOP UI */}
      <div className="hidden md:block">
        <div className="page-head">
          <div>
            <h1>{t('nav.settings')}</h1>
            <p className="sub">{t('settings.general')}</p>
          </div>
        </div>

        <div className="settings-shell">
          <div className="settings-nav">
            {sections.map(s => {
              const isActive = active === s.id || 
                              (s.id === 'profile' && active === 'edit_profile') || 
                              (s.id === 'budget' && (active === 'edit_budget' || active === 'categories'));
              return (
                <button key={s.id} className={isActive ? 'active' : ''} onClick={() => { setActive(s.id); setMessage(null); }}>
                  <Icon name={s.icon as IconName} size={14} />
                  <span>{s.label}</span>
                </button>
              );
            })}
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

            {(active === 'profile' || active === 'edit_profile') && (
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
                      type="text"
                      className={`input${fieldErrors.tieugonId ? ' error' : ''}`}
                      value={tieugonId}
                      onChange={e => { setTieugonId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); if (fieldErrors.tieugonId) setFieldErrors(prev => ({ ...prev, tieugonId: '' })); }}
                      placeholder="username"
                    />
                    {fieldErrors.tieugonId
                      ? <span className="field-error">⚠ {fieldErrors.tieugonId}</span>
                      : <p className="help">{t('settings.id_help')}</p>
                    }
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

            {(active === 'budget' || active === 'edit_budget' || active === 'categories') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="card">
                  <div className="settings-section">
                    <h4>{t('settings.budget_mgmt')}</h4>
                    <p className="desc">{t('settings.budget_desc')}</p>
                  </div>

                  <div className="field" style={{ marginTop: 20 }}>
                    <label className="label">{t('settings.budget_label')} {new Date().getMonth() + 1}</label>
                    <div className={`amount-input${fieldErrors.budget ? ' error' : ''}`}>
                      <input
                        type="text"
                        value={budget.toLocaleString()}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setBudget(val ? parseInt(val, 10) : 0);
                          if (fieldErrors.budget) setFieldErrors(prev => ({ ...prev, budget: '' }));
                        }}
                        placeholder="5,000,000"
                      />
                      <span className="unit">đ</span>
                    </div>
                    {fieldErrors.budget && <span className="field-error">⚠ {fieldErrors.budget}</span>}
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
      </div>

      {/* MOBILE UI */}
      <div className="block md:hidden" style={{ padding: '24px 20px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ink)' }}>Cài đặt</h1>
        </div>

        {/* Profile Card */}
        <div className="card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--line-2)', position: 'relative', marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div className="avatar xl" style={{ width: '80px', height: '80px', fontSize: '24px', background: 'var(--color-purple-600)', color: '#fff', position: 'relative' }}>
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials()}
              <button 
                onClick={() => fileInputRef.current?.click()}
                style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: '50%', width: '28px', height: '28px', display: 'grid', placeItems: 'center', color: 'var(--t2)' }}
              >
                <Icon name="camera" size={14} />
              </button>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{lastName} {firstName}</h2>
            </div>
          </div>
        </div>

        {active === 'edit_profile' ? (
          <div className="card" style={{ padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{t('settings.profile')}</h3>
               <button className="icon-btn sm" onClick={() => setActive('profile')}><Icon name="x" size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="field">
                <label className="label">ID</label>
                <input
                  type="text"
                  className={`input${fieldErrors.tieugonId ? ' error' : ''}`}
                  value={tieugonId}
                  onChange={e => { setTieugonId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); if (fieldErrors.tieugonId) setFieldErrors(prev => ({ ...prev, tieugonId: '' })); }}
                  placeholder="username"
                />
                {fieldErrors.tieugonId && <span className="field-error">⚠ {fieldErrors.tieugonId}</span>}
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
              <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveProfile} disabled={loading}>
                  {loading ? t('common.saving') : t('common.save_profile')}
                </button>
              </div>
            </div>
          </div>
        ) : active === 'edit_budget' ? (
          <div className="card" style={{ padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{t('settings.budget_mgmt')}</h3>
               <button className="icon-btn sm" onClick={() => setActive('profile')}><Icon name="x" size={20} /></button>
            </div>
            <div className="field">
              <label className="label">{t('settings.budget_label')}</label>
              <div className={`amount-input${fieldErrors.budget ? ' error' : ''}`}>
                <input
                  type="text"
                  value={budget.toLocaleString()}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setBudget(val ? parseInt(val, 10) : 0);
                    if (fieldErrors.budget) setFieldErrors(prev => ({ ...prev, budget: '' }));
                  }}
                />
                <span className="unit">đ</span>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={handleSaveBudget} disabled={loading}>
              {loading ? t('common.saving') : t('common.save_budget')}
            </button>
          </div>
        ) : active === 'categories' ? (
          <div className="card flush" style={{ borderRadius: '20px', border: '1px solid var(--line-2)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--line-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{t('settings.categories_title')}</h3>
               <div style={{ display: 'flex', gap: '8px' }}>
                 <button className="btn btn-primary btn-sm" onClick={handleAddCategory}>Thêm</button>
                 <button className="icon-btn sm" onClick={() => setActive('profile')}><Icon name="x" size={20} /></button>
               </div>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {categories.map(c => (
                <div key={c.id} style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: c.color + '20', color: c.color, display: 'grid', placeItems: 'center' }}>
                      <Icon name={c.icon || 'list'} size={16} />
                    </div>
                    <span style={{ fontWeight: 700 }}>{c.name}</span>
                  </div>
                  <button className="icon-btn sm" style={{ color: 'var(--rose)' }} onClick={() => handleDeleteCategory(c.id)}><Icon name="trash" size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Section: Account */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--t4)', letterSpacing: '0.05em', marginBottom: '12px', textTransform: 'uppercase' }}>TÀI KHOẢN</div>
              <div className="card flush" style={{ borderRadius: '16px', border: '1px solid var(--line-2)' }}>
                <button className="settings-row-btn" onClick={() => setActive('edit_profile')}>
                  <div className="icon-box"><Icon name="user" size={18} /></div>
                  <div className="label-area">
                    <div className="main-lbl">Hồ sơ công khai</div>
                    <div className="sub-lbl">@{tieugonId || 'sinsin'}</div>
                  </div>
                  <Icon name="arrow-right" size={16} style={{ color: 'var(--t4)' }} />
                </button>
                <div style={{ height: '1px', background: 'var(--line-2)', margin: '0 16px' }} />
                <div className="settings-row-btn no-click">
                  <div className="icon-box"><Icon name="mail" size={18} /></div>
                  <div className="label-area">
                    <div className="main-lbl">Email</div>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--t2)', fontWeight: 600 }}>{user.email}</div>
                </div>
              </div>
            </div>

            {/* Section: Budget */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--t4)', letterSpacing: '0.05em', marginBottom: '12px', textTransform: 'uppercase' }}>TIỀN & NGÂN SÁCH</div>
              <div className="card flush" style={{ borderRadius: '16px', border: '1px solid var(--line-2)' }}>
                <button className="settings-row-btn" onClick={() => setActive('edit_budget')}>
                  <div className="icon-box"><Icon name="home" size={18} /></div>
                  <div className="label-area">
                    <div className="main-lbl">Ngân sách tháng</div>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--t2)', fontWeight: 800 }}>{budget.toLocaleString()}đ</div>
                </button>
                <div style={{ height: '1px', background: 'var(--line-2)', margin: '0 16px' }} />
                <button className="settings-row-btn" onClick={() => setActive('categories')}>
                  <div className="icon-box"><Icon name="list" size={18} /></div>
                  <div className="label-area">
                    <div className="main-lbl">Danh mục chi tiêu</div>
                    <div className="sub-lbl">{categories.length} danh mục đang dùng</div>
                  </div>
                  <Icon name="arrow-right" size={16} style={{ color: 'var(--t4)' }} />
                </button>
              </div>
            </div>

            {/* Section: Language */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--t4)', letterSpacing: '0.05em', marginBottom: '12px', textTransform: 'uppercase' }}>HỆ THỐNG</div>
              <div className="card flush" style={{ borderRadius: '16px', border: '1px solid var(--line-2)' }}>
                <div className="settings-row-btn no-click">
                  <div className="icon-box"><Icon name="info" size={18} /></div>
                  <div className="label-area">
                    <div className="main-lbl">Ngôn ngữ</div>
                  </div>
                  <div className="seg">
                    <button className={locale === 'vi' ? 'active' : ''} onClick={() => setLocale('vi')}>VI</button>
                    <button className={locale === 'en' ? 'active' : ''} onClick={() => setLocale('en')}>EN</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button 
              className="btn btn-ghost" 
              onClick={handleLogout}
              style={{ color: 'var(--rose)', fontWeight: 800, padding: '16px', width: '100%', border: '1px solid var(--rose-2)', borderRadius: '16px', background: 'var(--card)' }}
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>

      {/* Internal CSS for custom elements */}
      <style jsx>{`
        .settings-row-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          text-align: left;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .settings-row-btn:hover:not(.no-click) {
          background: var(--bg-2);
        }
        .settings-row-btn.no-click {
          cursor: default;
        }
        .icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--bg-2);
          display: grid;
          place-items: center;
          color: var(--t2);
        }
        .label-area {
          flex: 1;
        }
        .main-lbl {
          font-size: 15px;
          font-weight: 700;
          color: var(--ink);
        }
        .sub-lbl {
          font-size: 12px;
          color: var(--t3);
          margin-top: 2px;
        }
      `}</style>

      <ConfirmModal 
        open={confirm.open} title={confirm.title} message={confirm.message} type={confirm.type}
        onConfirm={confirm.onConfirm} onClose={() => setConfirm(c => ({ ...c, open: false }))}
      />
    </div>
  );
};

export default SettingsPage;
