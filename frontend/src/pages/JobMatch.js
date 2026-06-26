import { useState, useEffect } from 'react';
import { resumeAPI, jobsAPI } from '../services/api';
import ScoreRing from '../components/ScoreRing';
import toast from 'react-hot-toast';
import './JobMatch.css';

export default function JobMatch() {
  const [resumes,   setResumes]   = useState([]);
  const [jobRoles,  setJobRoles]  = useState([]);
  const [resumeId,  setResumeId]  = useState('');
  const [jobTarget, setJobTarget] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [pageLoad,  setPageLoad]  = useState(true);

  useEffect(() => {
    Promise.all([
      resumeAPI.list(1, 20),
      jobsAPI.list(),
    ]).then(([rRes, jRes]) => {
      setResumes(rRes.data.data.resumes || []);
      setJobRoles(jRes.data.data.roles  || []);
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setPageLoad(false));
  }, []);

  const handleAnalyze = async () => {
    if (!jobTarget) { toast.error('Select a job target'); return; }
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        jobTarget,
        includeAI: true,
        ...(resumeId ? { resumeId } : {}),
      };
      const res = await resumeAPI.analyze(payload);
      setResult(res.data.data);
      toast.success('Job match analysis complete!');
    } catch (err) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoad) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  const scores        = result?.scores        || {};
  const skillAnalysis = result?.skillAnalysis || {};
  const matched       = skillAnalysis.matchedSkills  || [];
  const missing       = skillAnalysis.missingSkills  || [];
  const bonus         = skillAnalysis.bonusSkills    || [];
  const matchPct      = skillAnalysis.matchPercentage ?? 0;

  // Derived segment scores
  const skillMatchPct   = matchPct;
  const expMatchPct     = scores.experienceScore ?? 0;
  const keywordMatchPct = scores.resumeScore     ?? 0;
  const overallPct      = scores.jobScore        ?? 0;

  return (
    <div className="jobmatch-page">
      {/* Controls */}
      <div className="card jm-controls">
        <div className="jm-controls-grid">
          <div className="form-group">
            <label className="form-label">Resume (optional)</label>
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

          <div className="form-group">
            <label className="form-label">Target Job Role *</label>
            <select
              className="form-input"
              value={jobTarget}
              onChange={e => setJobTarget(e.target.value)}
            >
              <option value="">— Select job role —</option>
              {jobRoles.map(r => (
                <option key={r.key} value={r.key}>{r.displayName}</option>
              ))}
            </select>
          </div>

          <div className="jm-analyze-btn">
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || !jobTarget}>
              {loading
                ? <><span className="spinner" style={{width:16,height:16}} /> Analyzing...</>
                : '🎯 Run Job Match'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="jm-results animate-fade">
          {/* Hero score */}
          <div className="card jm-hero-card">
            <div className="jm-hero-left">
              <ScoreRing score={overallPct} size={150} color="auto" label="Overall" />
            </div>
            <div className="jm-hero-right">
              <div className="jm-hero-title">
                Job Match: <span className="text-gradient">{result.jobTarget?.displayName}</span>
              </div>
              <p className="jm-hero-interp">{scores.interpretation}</p>

              <div className="jm-match-bars">
                {[
                  { label: 'Skill Match',      val: skillMatchPct,   color: 'blue',   icon: '🧠' },
                  { label: 'Experience Match', val: expMatchPct,     color: 'violet', icon: '💼' },
                  { label: 'Keyword Match',    val: keywordMatchPct, color: 'cyan',   icon: '🔑' },
                ].map(m => (
                  <div key={m.label} className="jm-bar-item">
                    <div className="jm-bar-header">
                      <span className="jm-bar-icon">{m.icon}</span>
                      <span className="jm-bar-label">{m.label}</span>
                      <span className="jm-bar-val">{Math.round(m.val)}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: 8 }}>
                      <div
                        className={`progress-fill progress-fill-${m.color}`}
                        style={{ width: `${m.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Skills breakdown */}
          <div className="jm-skills-row">
            {/* Matched */}
            <div className="card jm-skill-col">
              <div className="jm-skill-header jm-skill-header-green">
                <span>✓</span> Skills You Have ({matched.length})
              </div>
              <div className="skill-tags" style={{ marginTop: 12 }}>
                {matched.length > 0
                  ? matched.map(s => <span key={s} className="skill-tag skill-tag-green">{s}</span>)
                  : <p className="jm-empty-skills">No matching skills detected</p>}
              </div>
            </div>

            {/* Missing */}
            <div className="card jm-skill-col">
              <div className="jm-skill-header jm-skill-header-red">
                <span>✗</span> Skills You Need ({missing.length})
              </div>
              <div className="skill-tags" style={{ marginTop: 12 }}>
                {missing.length > 0
                  ? missing.map(s => <span key={s} className="skill-tag skill-tag-red">{s}</span>)
                  : <p className="jm-empty-skills">Great! No critical missing skills</p>}
              </div>
            </div>

            {/* Bonus */}
            {bonus.length > 0 && (
              <div className="card jm-skill-col">
                <div className="jm-skill-header jm-skill-header-amber">
                  <span>★</span> Bonus Skills ({bonus.length})
                </div>
                <div className="skill-tags" style={{ marginTop: 12 }}>
                  {bonus.map(s => <span key={s} className="skill-tag skill-tag-amber">{s}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {result.feedback?.suggestions?.length > 0 && (
            <div className="card jm-suggestions">
              <h3 className="card-title">💡 How to Improve Your Match</h3>
              <div className="jm-suggestions-grid">
                {result.feedback.suggestions.slice(0, 6).map((s, i) => (
                  <div key={i} className="jm-suggestion-item">
                    <div className="jm-suggestion-num">{String(i+1).padStart(2,'0')}</div>
                    <p>{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required skills for role */}
          {result.requiredSkillsForRole?.length > 0 && (
            <div className="card">
              <h3 className="card-title">📋 All Required Skills for {result.jobTarget?.displayName}</h3>
              <div className="skill-tags" style={{ marginTop: 8 }}>
                {result.requiredSkillsForRole.map(s => {
                  const has = matched.map(m => m.toLowerCase()).includes(s.toLowerCase());
                  return (
                    <span
                      key={s}
                      className={`skill-tag ${has ? 'skill-tag-green' : 'skill-tag-red'}`}
                    >
                      {has ? '✓' : '✗'} {s}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="jm-placeholder">
          <div className="jm-placeholder-icon">🎯</div>
          <h3>Select a Job Role and Run Analysis</h3>
          <p>Resumely will match your resume against the selected role and show you a detailed breakdown</p>
        </div>
      )}
    </div>
  );
}
