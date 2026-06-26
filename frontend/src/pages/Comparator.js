import { useState, useEffect } from 'react';
import { resumeAPI, jobsAPI } from '../services/api';
import ScoreRing from '../components/ScoreRing';
import toast from 'react-hot-toast';
import './Comparator.css';

export default function Comparator() {
  const [resumes,    setResumes]    = useState([]);
  const [jobRoles,   setJobRoles]   = useState([]);
  const [resumeId1,  setResumeId1]  = useState('');
  const [resumeId2,  setResumeId2]  = useState('');
  const [jobTarget,  setJobTarget]  = useState('');
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [pageLoad,   setPageLoad]   = useState(true);

  useEffect(() => {
    Promise.all([resumeAPI.list(1, 20), jobsAPI.list()])
      .then(([rRes, jRes]) => {
        setResumes(rRes.data.data.resumes || []);
        setJobRoles(jRes.data.data.roles  || []);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setPageLoad(false));
  }, []);

  const handleCompare = async () => {
    if (!resumeId1 || !resumeId2) { toast.error('Select two resumes to compare'); return; }
    if (resumeId1 === resumeId2)  { toast.error('Select two different resumes');  return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await resumeAPI.compare({ resumeId1, resumeId2, jobTarget: jobTarget || undefined });
      setResult(res.data.data);
      toast.success(`Winner: ${res.data.data.winner} 🏆`);
    } catch (err) {
      toast.error(err.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const resumeName = (id) => {
    const r = resumes.find(r => r._id === id);
    return r ? (r.label || r.fileName || `Resume v${r.version}`) : id;
  };

  if (pageLoad) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div className="comparator-page">
      {/* Controls */}
      <div className="card comp-controls">
        <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Compare Two Resumes</h3>
        <div className="comp-controls-grid">
          <div className="form-group">
            <label className="form-label">Resume A</label>
            <select className="form-input" value={resumeId1} onChange={e => setResumeId1(e.target.value)}>
              <option value="">— Select resume —</option>
              {resumes.map(r => (
                <option key={r._id} value={r._id} disabled={r._id === resumeId2}>
                  {r.label || r.fileName || `Resume v${r.version}`}
                </option>
              ))}
            </select>
          </div>
          <div className="vs-badge">VS</div>
          <div className="form-group">
            <label className="form-label">Resume B</label>
            <select className="form-input" value={resumeId2} onChange={e => setResumeId2(e.target.value)}>
              <option value="">— Select resume —</option>
              {resumes.map(r => (
                <option key={r._id} value={r._id} disabled={r._id === resumeId1}>
                  {r.label || r.fileName || `Resume v${r.version}`}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Job Target (optional)</label>
            <select className="form-input" value={jobTarget} onChange={e => setJobTarget(e.target.value)}>
              <option value="">— Use resumes' existing target —</option>
              {jobRoles.map(r => (
                <option key={r.key} value={r.key}>{r.displayName}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={handleCompare}
              disabled={loading || !resumeId1 || !resumeId2}
              style={{ height: 44 }}
            >
              {loading
                ? <><span className="spinner" style={{width:16,height:16}} /> Comparing...</>
                : '⚖️ Compare Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="comp-results animate-fade">
          {/* Winner Banner */}
          <div className="winner-banner">
            <span className="winner-trophy">🏆</span>
            <div>
              <div className="winner-label">Winner</div>
              <div className="winner-name">
                {result.winner === 'Resume 1'
                  ? resumeName(resumeId1)
                  : resumeName(resumeId2)}
              </div>
            </div>
            <span className="winner-delta">
              +{result.scoreDelta} pts ahead
            </span>
          </div>

          {/* Side by side */}
          <div className="comp-side-by-side">
            {[
              { data: result.resume1, id: resumeId1, isWinner: result.winner === 'Resume 1' },
              { data: result.resume2, id: resumeId2, isWinner: result.winner === 'Resume 2' },
            ].map(({ data, id, isWinner }, idx) => (
              <div key={idx} className={`comp-column card ${isWinner ? 'comp-winner' : ''}`}>
                {isWinner && <div className="comp-winner-badge">🏆 Winner</div>}
                <div className="comp-col-header">
                  <div className="comp-col-label">Resume {idx + 1}</div>
                  <div className="comp-col-name">{resumeName(id)}</div>
                </div>

                <div className="comp-score-row">
                  <ScoreRing score={data?.overallScore || 0} size={100} color="auto" />
                  <div className="comp-score-details">
                    <div className="comp-score-num">{Math.round(data?.overallScore || 0)}</div>
                    <div className="comp-score-sub">Overall Score</div>
                    <div className="comp-score-sub">Job Score: {Math.round(data?.jobScore || 0)}%</div>
                  </div>
                </div>

                <div className="comp-bars">
                  {[
                    { label: 'Job Match',    val: data?.jobScore            || 0, color: 'blue'   },
                    { label: 'Skill Match',  val: data?.matchPercentage     || 0, color: 'green'  },
                    { label: 'Skills Count', val: Math.min((data?.skillCount || 0) * 3, 100), color: 'violet', raw: `${data?.skillCount || 0} skills` },
                  ].map(b => (
                    <div key={b.label} style={{ marginBottom: 10 }}>
                      <div className="flex-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{b.label}</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                          {b.raw || `${Math.round(b.val)}%`}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className={`progress-fill progress-fill-${b.color}`} style={{ width: `${b.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {data?.strengths?.length > 0 && (
                  <div className="comp-strengths">
                    <div className="comp-strengths-label">Key Strengths</div>
                    {data.strengths.map((s, i) => (
                      <div key={i} className="comp-strength-item">
                        <span style={{ color: 'var(--accent-emerald)' }}>✓</span> {s}
                      </div>
                    ))}
                  </div>
                )}

                {data?.uniqueSkills?.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div className="comp-strengths-label">Unique Skills</div>
                    <div className="skill-tags" style={{ marginTop: 6 }}>
                      {data.uniqueSkills.slice(0, 8).map(s => (
                        <span key={s} className="skill-tag skill-tag-cyan">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Skill diff table */}
          <div className="card comp-diff-card">
            <h3 className="card-title">Skill Differences</h3>
            <div className="comp-diff-grid">
              <div className="comp-diff-col">
                <div className="comp-diff-header" style={{ color: '#5eead4' }}>
                  Shared Skills ({result.skillDifferences?.sharedSkills?.length || 0})
                </div>
                <div className="skill-tags" style={{ marginTop: 8 }}>
                  {(result.skillDifferences?.sharedSkills || []).map(s => (
                    <span key={s} className="skill-tag skill-tag-green">{s}</span>
                  ))}
                </div>
              </div>
              <div className="comp-diff-col">
                <div className="comp-diff-header" style={{ color: '#f0c060' }}>
                  Only in Resume A ({result.skillDifferences?.uniqueToResume1?.length || 0})
                </div>
                <div className="skill-tags" style={{ marginTop: 8 }}>
                  {(result.skillDifferences?.uniqueToResume1 || []).map(s => (
                    <span key={s} className="skill-tag skill-tag-blue">{s}</span>
                  ))}
                </div>
              </div>
              <div className="comp-diff-col">
                <div className="comp-diff-header" style={{ color: '#f08060' }}>
                  Only in Resume B ({result.skillDifferences?.uniqueToResume2?.length || 0})
                </div>
                <div className="skill-tags" style={{ marginTop: 8 }}>
                  {(result.skillDifferences?.uniqueToResume2 || []).map(s => (
                    <span key={s} className="skill-tag skill-tag-violet">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Insight */}
          {result.aiInsight && (
            <div className="card comp-ai-insight">
              <h3 className="card-title">🤖 AI Comparison Insight</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                {result.aiInsight}
              </p>
            </div>
          )}
        </div>
      )}

      {!result && !loading && resumes.length < 2 && (
        <div className="comp-placeholder">
          <div className="comp-placeholder-icon">⚖️</div>
          <h3>Upload at Least 2 Resumes to Compare</h3>
          <p>Go to Upload Resume page and add multiple versions of your resume to compare them here</p>
        </div>
      )}

      {!result && !loading && resumes.length >= 2 && (
        <div className="comp-placeholder">
          <div className="comp-placeholder-icon">⚖️</div>
          <h3>Select Two Resumes and Compare</h3>
          <p>Pick any two resume versions and Resumely will give you a detailed side-by-side analysis</p>
        </div>
      )}
    </div>
  );
}
