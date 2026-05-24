'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface LoginScreenProps {
  onLogin: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { locale, setLocale, t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>('login');
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const supabase = createClient();

  const clearError = (field: string) => {
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = t('validation.required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t('validation.email_invalid');
    if (mode !== 'forgot') {
      if (!pw) e.pw = t('validation.required');
      else if (pw.length < 6) e.pw = t('validation.password_min');
    }
    if (mode === 'signup') {
      if (!firstName.trim()) e.firstName = t('validation.required');
      if (!lastName.trim()) e.lastName = t('validation.required');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        onLogin();
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password: pw,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              display_name: `${lastName} ${firstName}`.trim()
            }
          }
        });
        if (error) throw error;
        setMessage({ type: 'success', text: t('auth.signup_success') });
        setMode('login');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: t('auth.forgot_success') });
        setMode('login');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('auth.error_default') });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setMessage(null);
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
            <h2>
              {mode === 'login' && t('auth.title')}
              {mode === 'signup' && t('auth.signup_title')}
              {mode === 'forgot' && t('auth.forgot_title')}
            </h2>
            <p className="lead">
              {mode === 'login' && t('auth.subtitle_login')}
              {mode === 'signup' && t('auth.subtitle_signup')}
              {mode === 'forgot' && t('auth.subtitle_forgot')}
            </p>
          </div>

          {message && (
            <div className={`badge ${message.type === 'error' ? 'rose' : 'green'}`} style={{ padding: '10px', width: '100%', borderRadius: '8px' }}>
              {message.text}
            </div>
          )}

          {mode === 'signup' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="field">
                <label className="label">{t('auth.last_name')}</label>
                <input
                  className={`input${errors.lastName ? ' error' : ''}`}
                  type="text"
                  value={lastName}
                  onChange={e => { setLastName(e.target.value); clearError('lastName'); }}
                  placeholder="Nguyễn"
                  disabled={loading}
                />
                {errors.lastName && <span className="field-error">⚠ {errors.lastName}</span>}
              </div>
              <div className="field">
                <label className="label">{t('auth.first_name')}</label>
                <input
                  className={`input${errors.firstName ? ' error' : ''}`}
                  type="text"
                  value={firstName}
                  onChange={e => { setFirstName(e.target.value); clearError('firstName'); }}
                  placeholder="Văn A"
                  disabled={loading}
                />
                {errors.firstName && <span className="field-error">⚠ {errors.firstName}</span>}
              </div>
            </div>
          )}

          <div className="field">
            <label className="label">{t('auth.email')}</label>
            <input
              className={`input${errors.email ? ' error' : ''}`}
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clearError('email'); }}
              placeholder="email@example.com"
              disabled={loading}
            />
            {errors.email && <span className="field-error">⚠ {errors.email}</span>}
          </div>

          {mode !== 'forgot' && (
            <div className="field">
              <div className="row">
                <label className="label">{t('auth.password')}</label>
                {mode === 'login' && (
                  <button type="button" className="link" onClick={() => switchMode('forgot')}>{t('auth.forgot_link')}</button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className={`input${errors.pw ? ' error' : ''}`}
                  type={show ? 'text' : 'password'}
                  value={pw}
                  onChange={e => { setPw(e.target.value); clearError('pw'); }}
                  placeholder="••••••••"
                  style={{ paddingRight: 38 }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 6, borderRadius: 6, color: 'var(--t3)' }}
                  aria-label="Toggle password"
                >
                  <Icon name={show ? 'eye-off' : 'eye'} size={16} />
                </button>
              </div>
              {errors.pw && <span className="field-error">⚠ {errors.pw}</span>}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? t('auth.processing') : (
              <>
                {mode === 'login' && t('auth.submit_login')}
                {mode === 'signup' && t('auth.submit_signup')}
                {mode === 'forgot' && t('auth.submit_forgot')}
                <Icon name="arrow-right" size={14} />
              </>
            )}
          </button>

          <div className="auth-foot">
            {mode === 'login' ? (
              <>{t('auth.no_account')} <button type="button" className="link" onClick={() => switchMode('signup')}>{t('auth.register')}</button></>
            ) : (
              <>{t('auth.has_account')} <button type="button" className="link" onClick={() => switchMode('login')}>{t('auth.back_login')}</button></>
            )}
            <br />
            <span style={{ marginTop: '8px', display: 'inline-block' }}>
              {t('auth.terms')}
            </span>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
              <div className="seg">
                <button type="button" className={locale === 'vi' ? 'active' : ''} onClick={() => setLocale('vi')}>Tiếng Việt</button>
                <button type="button" className={locale === 'en' ? 'active' : ''} onClick={() => setLocale('en')}>English</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
