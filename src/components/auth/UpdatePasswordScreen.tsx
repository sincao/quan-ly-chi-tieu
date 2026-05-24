'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';

const UpdatePasswordScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { t, locale } = useLanguage();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const supabase = createClient();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!pw) e.pw = t('validation.required');
    else if (pw.length < 6) e.pw = t('validation.password_min');
    if (!confirm) e.confirm = t('validation.required');
    else if (pw !== confirm) e.confirm = locale === 'vi' ? 'Mật khẩu không khớp' : 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setDone(true);
      setTimeout(onDone, 2000);
    } catch (err: any) {
      setErrors({ pw: err.message || t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-art">
        <div>
          <div className="auth-art-bolt"><Icon name="zap" size={28} /></div>
          <h1>Quản Lý<br />Chi Tiêu</h1>
          <p className="tag">{t('auth.tagline')}</p>
        </div>
        <div className="quote">{t('auth.quote')}</div>
      </div>

      <div className="auth-form-shell">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div>
            <h2>{locale === 'vi' ? 'Đặt mật khẩu mới' : 'Set new password'}</h2>
            <p className="lead">{locale === 'vi' ? 'Nhập mật khẩu mới cho tài khoản của bạn.' : 'Enter a new password for your account.'}</p>
          </div>

          {done && (
            <div className="badge green" style={{ padding: '10px', width: '100%', borderRadius: '8px' }}>
              {locale === 'vi' ? 'Đổi mật khẩu thành công! Đang chuyển hướng...' : 'Password updated! Redirecting...'}
            </div>
          )}

          {!done && (
            <>
              <div className="field">
                <label className="label">{locale === 'vi' ? 'Mật khẩu mới' : 'New password'}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className={`input${errors.pw ? ' error' : ''}`}
                    type={show ? 'text' : 'password'}
                    value={pw}
                    onChange={e => { setPw(e.target.value); setErrors(prev => ({ ...prev, pw: '' })); }}
                    placeholder="••••••••"
                    style={{ paddingRight: 38 }}
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 6, borderRadius: 6, color: 'var(--t3)' }}
                  >
                    <Icon name={show ? 'eye-off' : 'eye'} size={16} />
                  </button>
                </div>
                {errors.pw && <span className="field-error">⚠ {errors.pw}</span>}
              </div>

              <div className="field">
                <label className="label">{locale === 'vi' ? 'Xác nhận mật khẩu' : 'Confirm password'}</label>
                <input
                  className={`input${errors.confirm ? ' error' : ''}`}
                  type={show ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setErrors(prev => ({ ...prev, confirm: '' })); }}
                  placeholder="••••••••"
                  disabled={loading}
                />
                {errors.confirm && <span className="field-error">⚠ {errors.confirm}</span>}
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? t('common.saving') : (locale === 'vi' ? 'Cập nhật mật khẩu' : 'Update password')}
                {!loading && <Icon name="arrow-right" size={14} />}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordScreen;
