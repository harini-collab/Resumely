import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Signup() {
  const [form, setForm] = useState({ userName: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get('next') || '/dashboard';

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.userName.trim()) {
      setError('Name is required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signup(form.userName.trim(), form.email, form.password);
      toast.success('Welcome to Resumely');
      navigate(next, { replace: true });
    } catch (err) {
      const msg = err.message || 'Registration failed';
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
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-sub">Start your resume workspace</p>
        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          {[
            { field: 'userName', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
            { field: 'email', label: 'Email Address', type: 'email', placeholder: 'you@company.com' },
          ].map(({ field, label, type, placeholder }) => (
            <div className="form-group" key={field}>
              <label className="form-label">{label}</label>
              <input
                className="form-input"
                type={type}
                placeholder={placeholder}
                value={form[field]}
                onChange={set(field)}
                required
              />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-wrapper">
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPw((value) => !value)}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" />Creating...</> : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch">
          Have an account? <Link to={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
