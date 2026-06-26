import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AccountPages.css';

export default function Profile() {
  const { user } = useAuth();
  const firstName = user?.userName?.split(' ')[0] || 'User';
  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Recently';

  return (
    <div className="account-page animate-fade">
      <div className="account-page-header">
        <div>
          <p className="account-kicker">Profile</p>
          <h1>{firstName}'s account</h1>
          <p>Review your account details and resume activity.</p>
        </div>
        <Link to="/upload" className="btn btn-primary">Upload Resume</Link>
      </div>

      <div className="account-grid">
        <section className="account-card account-main-card">
          <div className="profile-avatar-large">
            {user?.userName?.charAt(0).toUpperCase() || 'R'}
          </div>
          <div>
            <h2>{user?.userName || 'Resumely User'}</h2>
            <p>{user?.email || 'No email available'}</p>
          </div>
        </section>

        <section className="account-card">
          <p className="account-card-label">Account details</p>
          <div className="detail-list">
            <div>
              <span>User ID</span>
              <strong>{user?.id || user?._id || 'Not available'}</strong>
            </div>
            <div>
              <span>Joined</span>
              <strong>{joined}</strong>
            </div>
            <div>
              <span>Last active</span>
              <strong>{user?.lastActive ? new Date(user.lastActive).toLocaleString() : 'Current session'}</strong>
            </div>
          </div>
        </section>

        <section className="account-card">
          <p className="account-card-label">Resume activity</p>
          <div className="metric-row">
            <div>
              <strong>{user?.resumeCount ?? 0}</strong>
              <span>Uploaded resumes</span>
            </div>
            <Link to="/dashboard" className="btn btn-secondary btn-sm">View Library</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
