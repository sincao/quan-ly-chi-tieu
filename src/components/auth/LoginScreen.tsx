import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase/client';

interface LoginScreenProps {
  onLogin: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        onLogin();
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ 
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
        
        // Ensure profile is created immediately to avoid 403 on later actions
        if (data.user) {
          await supabase.from('profiles').insert({ 
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            display_name: `${lastName} ${firstName}`.trim()
          });
        }

        setMessage({ type: 'success', text: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.' });
        setMode('login');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/settings/security`,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Yêu cầu đã được gửi! Vui lòng kiểm tra email của bạn.' });
        setMode('login');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Đã có lỗi xảy ra.' });
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
          <p className="tag">Stop burning money. Or don't — chúng tôi vẫn theo dõi mà.</p>
        </div>
        <div className="quote">
          "Tiền của bạn đang vơi dần như tình cảm của crush vậy." 💸
        </div>
      </div>

      <div className="auth-form-shell">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <h2>
              {mode === 'login' && 'Đăng nhập'}
              {mode === 'signup' && 'Đăng ký tài khoản'}
              {mode === 'forgot' && 'Khôi phục mật khẩu'}
            </h2>
            <p className="lead">
              {mode === 'login' && 'Để app bắt đầu phán xét bạn 🙂'}
              {mode === 'signup' && 'Bắt đầu hành trình tiết kiệm ngay hôm nay.'}
              {mode === 'forgot' && 'Nhập email để nhận link đặt lại mật khẩu.'}
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
                <label className="label">Họ</label>
                <input 
                  className="input" 
                  type="text"
                  required
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  placeholder="Nguyễn" 
                  disabled={loading}
                />
              </div>
              <div className="field">
                <label className="label">Tên</label>
                <input 
                  className="input" 
                  type="text"
                  required
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  placeholder="Văn A" 
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="field">
            <label className="label">Email</label>
            <input 
              className="input" 
              type="email"
              required
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="email@example.com" 
              disabled={loading}
            />
          </div>

          {mode !== 'forgot' && (
            <div className="field">
              <div className="row">
                <label className="label">Mật khẩu</label>
                {mode === 'login' && (
                  <button type="button" className="link" onClick={() => setMode('forgot')}>Quên mật khẩu?</button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  className="input" 
                  type={show ? 'text' : 'password'} 
                  required
                  value={pw} 
                  onChange={e => setPw(e.target.value)} 
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
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Đang xử lý...' : (
              <>
                {mode === 'login' && 'Đăng nhập'}
                {mode === 'signup' && 'Đăng ký'}
                {mode === 'forgot' && 'Gửi link khôi phục'}
                <Icon name="arrow-right" size={14} />
              </>
            )}
          </button>

          <div className="auth-foot">
            {mode === 'login' ? (
              <>Chưa có tài khoản? <button type="button" className="link" onClick={() => setMode('signup')}>Đăng ký</button></>
            ) : (
              <>Đã có tài khoản? <button type="button" className="link" onClick={() => setMode('login')}>Quay lại đăng nhập</button></>
            )}
            <br />
            <span style={{ marginTop: '8px', display: 'inline-block' }}>
              Bằng cách tiếp tục, bạn đồng ý để app phán xét túi tiền 🙂
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
