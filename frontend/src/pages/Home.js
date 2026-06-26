import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const FEATURES = [
  {
    key: 'analyzer',
    title: 'Resume Analyzer',
    route: '/upload',
    metric: 'ATS score',
    desc: 'Upload a resume, choose a role, and get scoring, missing skills, strengths, and next actions.',
  },
  {
    key: 'job-match',
    title: 'Job Match',
    route: '/job-match',
    metric: 'Role fit',
    desc: 'Compare your resume against a target role and see the skill and experience gaps to close.',
  },
  {
    key: 'compare',
    title: 'Resume Comparator',
    route: '/comparator',
    metric: 'Version test',
    desc: 'Check two resume versions side by side and keep the one that reads stronger for hiring systems.',
  },
  {
    key: 'career',
    title: 'Career Intel',
    route: '/career-match',
    metric: 'Path ideas',
    desc: 'Explore aligned roles and practical improvements based on your current profile.',
  },
  {
    key: 'progress',
    title: 'Progress Tracker',
    route: '/progress',
    metric: 'History',
    desc: 'Track score changes over time as you improve and re-analyze your resume.',
  },
  {
    key: 'dashboard',
    title: 'Workspace Dashboard',
    route: '/dashboard',
    metric: 'Overview',
    desc: 'Review your latest score, resume library, recommendations, and next best action.',
  },
];

const WORKFLOW = [
  ['1', 'Sign in or create an account'],
  ['2', 'Upload your resume'],
  ['3', 'Pick a target role'],
  ['4', 'Improve and track results'],
];

export default function Home() {
  const { user } = useAuth();

  const featureHref = (route) => {
    if (user) return route;
    return `/login?next=${encodeURIComponent(route)}`;
  };

  return (
    <div className="home">
      <nav className="home-nav">
        <Link to="/" className="home-nav-logo">
          <img className="logo-icon-home" src="/resumely-logo.png" alt="Resumely logo" />
          <span>Resum<span className="brand-word-accent">ely</span></span>
        </Link>
        <div className="home-nav-links">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">Open Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Sign In</Link>
              <Link to="/signup" className="btn btn-primary">Create Account</Link>
            </>
          )}
        </div>
      </nav>

      <main className="home-shell">
        <section className="home-overview">
          <div>
            <p className="home-kicker">Resume workspace</p>
            <h1>Choose a tool and start improving your resume.</h1>
            <p className="home-lead">
              Resumely gives you a focused workspace for resume analysis, job matching,
              version comparison, career guidance, and progress tracking.
            </p>
          </div>
          <div className="home-actions">
            <Link to={user ? '/upload' : '/login?next=%2Fupload'} className="btn btn-primary btn-lg">
              Start Analysis
            </Link>
            <Link to={user ? '/dashboard' : '/login?next=%2Fdashboard'} className="btn btn-secondary btn-lg">
              View Dashboard
            </Link>
          </div>
        </section>

        <section className="feature-board" aria-label="Feature dashboard">
          {FEATURES.map((feature) => (
            <Link key={feature.key} to={featureHref(feature.route)} className="feature-tile">
              <div className="feature-tile-top">
                <span className="feature-marker">{feature.metric}</span>
                <span className="feature-arrow">Open</span>
              </div>
              <h2>{feature.title}</h2>
              <p>{feature.desc}</p>
            </Link>
          ))}
        </section>

        <section className="home-lower">
          <div className="workflow-panel">
            <p className="panel-label">How it works</p>
            <div className="workflow-list">
              {WORKFLOW.map(([step, label]) => (
                <div className="workflow-row" key={step}>
                  <span>{step}</span>
                  <p>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="status-panel">
            <p className="panel-label">Workspace status</p>
            <div className="status-grid">
              <div>
                <strong>{user ? 'Signed in' : 'Guest'}</strong>
                <span>Account</span>
              </div>
              <div>
                <strong>6</strong>
                <span>Tools</span>
              </div>
              <div>
                <strong>PDF/TXT</strong>
                <span>Upload types</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
