import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AIBot from '../components/AIBot';
import './AppLayout.css';

const NAV_ITEMS = [
  { path: '/dashboard',    label: 'Dashboard' },
  { path: '/upload',       label: 'Upload Resume' },
  { path: '/job-match',    label: 'Job Match' },
  { path: '/comparator',   label: 'Comparator' },
  { path: '/career-match', label: 'Career Intel' },
  { path: '/progress',     label: 'Progress' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const userInitial = user?.userName?.charAt(0).toUpperCase() || 'R';

  const handleMenuAction = (action) => {
    setAccountOpen(false);
    setNavOpen(false);

    if (action === 'resumes') {
      navigate('/dashboard');
      return;
    }

    if (action === 'profile' || action === 'settings') {
      navigate(`/${action}`);
      return;
    }

    if (action === 'signout') {
      handleLogout();
      return;
    }
  };

  return (
    <div className="app-layout">
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-brand" onClick={() => navigate('/dashboard')} role="button" tabIndex={0}>
              <img className="topbar-logo-icon" src="/resumely-logo.png" alt="Resumely logo" />
              <span className="topbar-logo-text">
                Resum<span className="brand-word-accent">ely</span>
              </span>
            </div>

            <nav className="topbar-nav" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `topbar-nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="topbar-right">
            <button
              className="menu-btn"
              onClick={() => setNavOpen((value) => !value)}
              aria-label="Open navigation menu"
              aria-expanded={navOpen}
            >
              <span />
              <span />
              <span />
            </button>

            <div className="account-menu" ref={accountRef}>
              <button
                className="topbar-avatar"
                onClick={() => setAccountOpen((value) => !value)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                title="Account menu"
              >
                {userInitial}
              </button>

              {accountOpen && (
                <div className="account-dropdown" role="menu">
                  <div className="account-dropdown-user">
                    <div className="account-dropdown-avatar">{userInitial}</div>
                    <div>
                      <div className="account-dropdown-name">{user?.userName || 'Resumely User'}</div>
                      <div className="account-dropdown-email">{user?.email || 'Signed in'}</div>
                    </div>
                  </div>
                  <button role="menuitem" onClick={() => handleMenuAction('profile')}>Profile</button>
                  <button role="menuitem" onClick={() => handleMenuAction('settings')}>Settings</button>
                  <button role="menuitem" onClick={() => handleMenuAction('resumes')}>My Resumes</button>
                  <button role="menuitem" className="danger" onClick={() => handleMenuAction('signout')}>Sign Out</button>
                </div>
              )}
            </div>
          </div>

          {navOpen && (
            <nav className="mobile-nav-panel" aria-label="Mobile navigation">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setNavOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}
        </header>

        <main className="page-content">
          <Outlet />
        </main>

        <AIBot />
      </div>
    </div>
  );
}
