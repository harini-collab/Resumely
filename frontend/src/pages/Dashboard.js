import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resumeAPI } from '../services/api';
import ScoreRing from '../components/ScoreRing';
import StatCard from '../components/StatCard';
import toast from 'react-hot-toast';
import '../components/StatCard.css';
import './Dashboard.css';

function ConfirmDelete({ name, onConfirm, onCancel, loading }) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <div className="confirm-icon">🗑</div>
        <h3 className="confirm-title">Delete Resume?</h3>
        <p className="confirm-desc">
          "<strong>{name}</strong>" will be permanently deleted.<br />This cannot be undone.
        </p>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <><span className="spinner"/>Deleting…</> : '⌫ Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [resumes,    setResumes]    = useState([]);
  const [latest,     setLatest]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  const load = useCallback(async () => {
    try {
      const res  = await resumeAPI.list(1, 10);
      const list = res.data.data.resumes || [];
      setResumes(list);
      const analyzed = list.find(r => r.isAnalyzed);
      if (analyzed) {
        const detail = await resumeAPI.get(analyzed._id);
        setLatest(detail.data.data);
      }
    } catch { toast.error('Failed to load data'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await resumeAPI.delete(deleteTarget._id);
      toast.success(`"${deleteTarget.label || 'Resume'}" deleted`);
      setDeleteTarget(null);
      if (latest?._id === deleteTarget._id) setLatest(null);
      await load();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const scores       = latest?.scores || {};
  const skill        = latest?.skillAnalysis || {};
  const fb           = latest?.feedback || {};
  const atsScore     = scores.completenessScore ?? 0;
  const resumeScore  = scores.resumeScore       ?? 0;
  const jobScore     = scores.jobScore          ?? 0;
  const expScore     = scores.experienceScore   ?? 0;
  const matchPct     = skill.matchPercentage    ?? 0;
  const matched      = skill.matched            || [];
  const missing      = skill.missing            || [];
  const extra        = skill.extra              || [];
  const suggestions  = fb.suggestions           || [];
  const strengths    = fb.strengths             || [];
  const weaknesses   = fb.weaknesses            || [];
  const aiSugg       = fb.aiSuggestions         || [];

  const priorityBadge = (text) => {
    const l = text.toLowerCase();
    if (l.includes('critical')||l.includes('missing')||l.includes('add'))
      return <span className="badge badge-red">Critical</span>;
    if (l.includes('consider')||l.includes('improve'))
      return <span className="badge badge-amber">Improve</span>;
    return <span className="badge badge-green">Tip</span>;
  };

  if (loading) return (
    <div className="page-loading">
      <div className="spinner spinner-lg"/>
      <p>Loading your workspace…</p>
    </div>
  );

  return (
    <div className="dashboard animate-fade">
      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.label || deleteTarget.fileName || 'Resume'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-greeting">
            Good day, <span className="text-gradient">{user?.userName?.split(' ')[0]}</span>
          </h1>
          <p className="dash-sub">
            {latest
              ? `Active analysis · ${latest.jobTarget?.displayName}`
              : 'Upload your first resume to begin'}
          </p>
        </div>
        <Link to="/upload" className="btn btn-primary">
          ↑ {latest ? 'New Analysis' : 'Upload Resume'}
        </Link>
      </div>

      {!latest ? (
        <div className="dash-empty">
          <div className="empty-glyph">◈</div>
          <h3>No Analysis Yet</h3>
          <p>Upload a resume and select a job target to unlock your full Resume Intelligence dashboard.</p>
          <Link to="/upload" className="btn btn-primary btn-lg" style={{marginTop:24}}>
            Get Started →
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="dash-stats">
            <StatCard icon="◎" label="ATS Score"     value={`${Math.round(atsScore)}%`}    color="green"  sub="Resume completeness" />
            <StatCard icon="◈" label="Resume Quality" value={`${Math.round(resumeScore)}%`} color="blue"   sub="Overall quality" />
            <StatCard icon="↗" label="Job Match"      value={`${Math.round(jobScore)}%`}    color="cyan"   sub={latest.jobTarget?.displayName} />
            <StatCard icon="⇄" label="Skill Match"    value={`${Math.round(matchPct)}%`}    color="amber"  sub={`${matched.length}/${matched.length+missing.length} skills`} />
          </div>

          {/* Scores + Skills */}
          <div className="dash-mid-row">
            <div className="card dash-rings-card">
              <p className="card-label">Score Breakdown</p>
              <div className="rings-grid">
                {[
                  {s:atsScore,    l:'ATS'},
                  {s:resumeScore, l:'Quality'},
                  {s:jobScore,    l:'Job Fit'},
                  {s:expScore,    l:'Experience'},
                ].map(r => (
                  <div key={r.l} className="ring-item">
                    <ScoreRing score={r.s} size={100} color="auto" />
                    <span className="ring-label">{r.l}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card dash-skills-card">
              <p className="card-label">Skill Analysis</p>
              <div className="skills-sections">
                {matched.length > 0 && (
                  <div className="skills-group">
                    <div className="skills-group-label">
                      <span className="dot dot-green"/> Present ({matched.length})
                    </div>
                    <div className="skill-tags">
                      {matched.slice(0,12).map(s=><span key={s} className="skill-tag skill-tag-green">{s}</span>)}
                      {matched.length>12 && <span className="skill-tag skill-tag-muted">+{matched.length-12}</span>}
                    </div>
                  </div>
                )}
                {missing.length > 0 && (
                  <div className="skills-group">
                    <div className="skills-group-label">
                      <span className="dot dot-red"/> Missing ({missing.length})
                    </div>
                    <div className="skill-tags">
                      {missing.slice(0,10).map(s=><span key={s} className="skill-tag skill-tag-red">{s}</span>)}
                      {missing.length>10 && <span className="skill-tag skill-tag-muted">+{missing.length-10}</span>}
                    </div>
                  </div>
                )}
                {extra.length > 0 && (
                  <div className="skills-group">
                    <div className="skills-group-label">
                      <span className="dot dot-amber"/> Bonus ({extra.length})
                    </div>
                    <div className="skill-tags">
                      {extra.slice(0,8).map(s=><span key={s} className="skill-tag skill-tag-amber">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback Row */}
          {(strengths.length > 0 || weaknesses.length > 0) && (
            <div className="dash-feedback-row">
              {strengths.length > 0 && (
                <div className="card">
                  <p className="card-label">Strengths</p>
                  <div className="feedback-list">
                    {strengths.map((s,i)=>(
                      <div key={i} className="feedback-item feedback-pos">
                        <span className="fb-icon">✓</span><span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {weaknesses.length > 0 && (
                <div className="card">
                  <p className="card-label">Areas to Improve</p>
                  <div className="feedback-list">
                    {weaknesses.map((w,i)=>(
                      <div key={i} className="feedback-item feedback-neg">
                        <span className="fb-icon">→</span><span>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="card">
              <div className="flex-between" style={{marginBottom:18}}>
                <p className="card-label" style={{margin:0}}>Improvement Suggestions</p>
                <Link to="/upload" className="btn btn-secondary btn-sm">Improve Resume ↑</Link>
              </div>
              <div className="suggestions-grid">
                {suggestions.map((s,i)=>(
                  <div key={i} className="suggestion-card">
                    <div className="sugg-num">{String(i+1).padStart(2,'0')}</div>
                    <div>
                      {priorityBadge(s)}
                      <p className="sugg-text">{s}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          {aiSugg.length > 0 && (
            <div className="card dash-ai">
              <p className="card-label">AI Insights</p>
              {aiSugg.map((s,i)=>(
                <div key={i} className="ai-item">
                  <span className="ai-dot">◆</span>
                  <p>{s}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Resume Library */}
      {resumes.length > 0 && (
        <div className="card dash-library">
          <div className="flex-between" style={{marginBottom:18}}>
            <p className="card-label" style={{margin:0}}>Resume Library</p>
            <Link to="/comparator" className="btn btn-ghost btn-sm">Compare →</Link>
          </div>
          <div className="resume-list">
            {resumes.map(r => (
              <div key={r._id} className="resume-row">
                <div className="resume-row-glyph">◈</div>
                <div className="resume-row-info">
                  <div className="resume-row-name">{r.label || r.fileName || `Resume v${r.version}`}</div>
                  <div className="resume-row-meta">
                    {r.jobTarget?.displayName && <span className="badge badge-green">{r.jobTarget.displayName}</span>}
                    {r.isAnalyzed
                      ? <span className="badge badge-blue">Analyzed</span>
                      : <span className="badge badge-amber">Pending</span>}
                    <span className="resume-date">{new Date(r.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                  </div>
                </div>
                <button
                  className="btn-icon danger"
                  title="Delete resume"
                  onClick={() => setDeleteTarget(r)}
                >
                  ⌫
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
