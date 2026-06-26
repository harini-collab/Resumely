import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.resetPassword(token, password);
      const { token: jwt, data } = res.data;
      setSession(jwt, data.user);
      toast.success('Password updated — you are signed in.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.message || 'Reset failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <Link to="/login" className="auth-back">Back to Sign In</Link>
        <div className="auth-card">
          <h2 className="auth-title">Invalid Link</h2>
          <p className="auth-sub">This reset link is invalid or has expired.</p>
          <p className="auth-switch">
            <Link to="/forgot-password">Request a new reset link</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <Link to="/login" className="auth-back">Back to Sign In</Link>
      <div className="auth-card">
        <div className="auth-logo">
          <img className="auth-logo-mark" src="/resumely-logo.png" alt="Resumely logo" />
          <span>Resum<span className="brand-word-accent">ely</span></span>
        </div>
        <h2 className="auth-title">New Password</h2>
        <p className="auth-sub">Choose a new password for your account</p>
        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="password-wrapper">
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPw((v) => !v)}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              className="form-input"
              type={showPw ? 'text' : 'password'}
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" />Updating...</> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
