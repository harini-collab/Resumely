import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get('next') || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back');
      navigate(next, { replace: true });
    } catch (err) {
      const msg = err.message || 'Invalid credentials';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-back">Back Home</Link>
      <div className="auth-card">
        <div className="auth-logo">
          <img className="auth-logo-mark" src="/resumely-logo.png" alt="Resumely logo" />
          <span>Resum<span className="brand-word-accent">ely</span></span>
        </div>
        <h2 className="auth-title">Sign In</h2>
        <p className="auth-sub">Access your Resume Intelligence Platform</p>
        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group">
            <div className="auth-label-row">
              <label className="form-label">Password</label>
              <Link to="/forgot-password" className="auth-forgot">Forgot password?</Link>
            </div>
            <div className="password-wrapper">
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPw((value) => !value)}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" />Signing in...</> : 'Sign In'}
          </button>
        </form>
        <p className="auth-switch">
          No account? <Link to={`/signup?next=${encodeURIComponent(next)}`}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
