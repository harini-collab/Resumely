import { useState, useEffect } from 'react';
import { careerAPI, resumeAPI } from '../services/api';
import toast from 'react-hot-toast';
import './CareerMatch.css';

const ConfidenceMeter = ({ value, animate }) => {
  const color = value >= 70 ? '#52b85a' : value >= 45 ? '#e8c060' : '#e07060';
  return (
    <div className="conf-meter">
      <div className="conf-bar-bg">
        <div
          className="conf-bar-fill"
          style={{
            width: animate ? `${value}%` : '0%',
            background: color,
            transition: 'width 0.9s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />
      </div>
      <span className="conf-val" style={{ color }}>{value}%</span>
    </div>
  );
};

const InsightCard = ({ icon, title, items, color }) => (
  <div className={`insight-card insight-card--${color}`}>
    <div className="insight-header">
      <span className="insight-icon">{icon}</span>
      <span className="insight-title">{title}</span>
    </div>
    <div className="insight-body">
      {items.length > 0
        ? items.map((item, i) => (
            <div key={i} className="insight-item">
              <span className="insight-dot" />
              <span>{typeof item === 'string' ? item : item.skill || item}</span>
              {item.count && <span className="insight-count">×{item.count}</span>}
            </div>
          ))
        : <p className="insight-empty">None found yet</p>
      }
    </div>
  </div>
);

export default function CareerMatch() {
  const [resumes,   setResumes]   = useState([]);
  const [resumeId,  setResumeId]  = useState('');
  const [matches,   setMatches]   = useState(null);
  const [insights,  setInsights]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [pageLoad,  setPageLoad]  = useState(true);
  const [animated,  setAnimated]  = useState(false);
  const [activeTab, setActiveTab] = useState('matches');

  useEffect(() => {
    Promise.all([
      resumeAPI.list(1, 20),
      careerAPI.insights(),
    ])
      .then(([rRes, iRes]) => {
        setResumes(rRes.data.data.resumes || []);
        setInsights(iRes.data.data);
      })
      .catch(() => {})
      .finally(() => setPageLoad(false));
  }, []);

  const handleMatch = async () => {
    setLoading(true);
    setMatches(null);
    setAnimated(false);
    try {
      const res = await careerAPI.jobMatch(resumeId ? { resumeId } : {});
      setMatches(res.data.data);
      toast.success(`Found ${res.data.data.jobMatches.length} role matches!`);
      setTimeout(() => setAnimated(true), 100);
    } catch (err) {
      toast.error(err.message || 'Job match failed');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoad) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div className="career-page">
      {/* Header */}
      <div className="career-hero animate-fade">
        <div className="career-hero-text">
          <h1 className="career-title">
            Career <span className="text-gradient">Intelligence</span>
          </h1>
          <p className="career-sub">
            Discover which roles fit your profile best — powered by your resume data.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="career-tabs">
        {[
          { id: 'matches',  label: '🎯 Job Matches' },
          { id: 'insights', label: '💡 Insights' },
        ].map(t => (
          <button
            key={t.id}
            className={`career-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── JOB MATCHES TAB ── */}
      {activeTab === 'matches' && (
        <div className="animate-fade">
          {/* Controls */}
          <div className="card career-controls">
            <h3 className="career-controls-title">Find Your Best-Fit Roles</h3>
            <div className="career-controls-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Resume to Analyze</label>
                <select
                  className="form-input"
                  value={resumeId}
                  onChange={e => setResumeId(e.target.value)}
                >
                  <option value="">— Use latest analyzed resume —</option>
                  {resumes.map(r => (
                    <option key={r._id} value={r._id}>
                      {r.label || r.fileName || `Resume v${r.version}`}
                      {r.isAnalyzed ? ' ✓' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary career-run-btn"
                onClick={handleMatch}
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Matching...</>
                  : '🎯 Run Career Match'}
              </button>
            </div>
          </div>

          {/* Results */}
          {matches && (
            <div className="career-results animate-fade">
              <div className="career-results-meta">
                <span className="meta-label">Resume:</span>
                <span className="meta-val">{matches.label}</span>
                <span className="meta-sep">·</span>
                <span className="meta-label">Skills detected:</span>
                <span className="meta-val">{matches.totalSkills}</span>
              </div>

              <div className="matches-grid">
                {matches.jobMatches.map((m, i) => (
                  <div
                    key={m.role}
                    className={`match-card ${i === 0 ? 'match-card--top' : ''}`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {i === 0 && <div className="match-top-badge">🏆 Best Match</div>}
                    <div className="match-card-header">
                      <div className="match-rank">#{i + 1}</div>
                      <div className="match-role-info">
                        <div className="match-role-name">{m.displayName}</div>
                        <div className="match-req">
                          {m.matchedRequired}/{m.totalRequired} core skills
                        </div>
                      </div>
                    </div>

                    <ConfidenceMeter value={m.confidence} animate={animated} />

                    <p className="match-reason">{m.reason}</p>

                    {m.missingRequired.length > 0 && (
                      <div className="match-missing">
                        <span className="match-missing-label">Missing:</span>
                        <div className="skill-tags" style={{ marginTop: 4 }}>
                          {m.missingRequired.map(s => (
                            <span key={s} className="skill-tag skill-tag-red">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!matches && !loading && (
            <div className="career-placeholder">
              <div className="career-placeholder-icon">🎯</div>
              <h3>Run Career Match</h3>
              <p>We'll score your resume against every role in our database and rank your best fits.</p>
            </div>
          )}
        </div>
      )}

      {/* ── INSIGHTS TAB ── */}
      {activeTab === 'insights' && (
        <div className="animate-fade">
          {insights && insights.totalResumes > 0 ? (
            <>
              {/* Stats row */}
              <div className="insights-stats">
                {[
                  { icon: '📄', label: 'Resumes Analyzed', val: insights.totalResumes },
                  { icon: '🎯', label: 'Avg Job Score',    val: `${insights.averageJobScore}%` },
                  { icon: '📈', label: 'Score Improvement',val: `${insights.scoreImprovement > 0 ? '+' : ''}${insights.scoreImprovement}%` },
                  { icon: '🏆', label: 'Top Target Role',  val: insights.targetRoles?.[0] || '—' },
                ].map(s => (
                  <div key={s.label} className="insights-stat-card">
                    <div className="insights-stat-icon">{s.icon}</div>
                    <div className="insights-stat-val">{s.val}</div>
                    <div className="insights-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Latest resume */}
              {insights.latestResume && (
                <div className="card insights-latest">
                  <p className="card-label">Latest Resume Performance</p>
                  <div className="insights-latest-row">
                    <div className="insights-latest-name">{insights.latestResume.label}</div>
                    <div className="insights-score-row">
                      {[
                        { label: 'Job Score',    val: insights.latestResume.jobScore },
                        { label: 'Resume Score', val: insights.latestResume.resumeScore },
                      ].map(s => (
                        <div key={s.label} className="insights-score-pill">
                          <span className="insights-score-label">{s.label}</span>
                          <span className="insights-score-val">{Math.round(s.val || 0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Skill insights grid */}
              <div className="insights-grid">
                <InsightCard
                  icon="⚠️"
                  title="Top Missing Skills"
                  items={insights.topMissingSkills || []}
                  color="red"
                />
                <InsightCard
                  icon="✅"
                  title="Your Strongest Skills"
                  items={insights.topStrengthSkills || []}
                  color="green"
                />
              </div>

              {/* Recommendations */}
              {insights.recommendations?.length > 0 && (
                <div className="card insights-recs">
                  <p className="card-label">📋 Recommendations</p>
                  {insights.recommendations.map((r, i) => (
                    <div key={i} className="insights-rec-item">
                      <span className="insights-rec-num">{String(i + 1).padStart(2, '0')}</span>
                      <p>{r}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="career-placeholder">
              <div className="career-placeholder-icon">💡</div>
              <h3>No Insights Yet</h3>
              <p>Upload and analyze at least one resume to unlock your Career Intelligence dashboard.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
