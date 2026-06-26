import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setSent(true);
      toast.success('If this email exists, a reset link has been sent.');
    } catch (err) {
      const msg = err.message || 'Request failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Link to="/login" className="auth-back">Back to Sign In</Link>
      <div className="auth-card">
        <div className="auth-logo">
          <img className="auth-logo-mark" src="/resumely-logo.png" alt="Resumely logo" />
          <span>Resum<span className="brand-word-accent">ely</span></span>
        </div>
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-sub">
          {sent
            ? 'Check your inbox for a reset link. You can close this page.'
            : 'Enter your email and we will send a reset link.'}
        </p>
        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
        {!sent && (
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
            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" />Sending...</> : 'Send Reset Link'}
            </button>
          </form>
        )}
        <p className="auth-switch">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
