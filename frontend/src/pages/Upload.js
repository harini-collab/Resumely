import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeAPI, jobsAPI } from '../services/api';
import toast from 'react-hot-toast';
import ScoreRing from '../components/ScoreRing';
import './Upload.css';

const STEPS = ['Upload', 'Configure', 'Results'];

export default function Upload() {
  const [step, setStep]         = useState(0);
  const [file, setFile]         = useState(null);
  const [text, setText]         = useState('');
  const [jobRoles, setJobRoles] = useState([]);
  const [jobTarget, setJobTarget] = useState('');
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumeId, setResumeId] = useState(null);
  const [result, setResult]     = useState(null);
  const [drag, setDrag]         = useState(false);
  const fileRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    jobsAPI.list().then(res => {
      setJobRoles(res.data.data.roles || []);
    }).catch(() => {});
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleFileSelect = (f) => {
    const allowed = ['application/pdf', 'text/plain'];
    if (!allowed.includes(f.type)) {
      toast.error('Only PDF or TXT files are supported');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    setFile(f);
    setText('');
  };

  const handleUpload = async () => {
    if (!file && !text.trim()) {
      toast.error('Please upload a file or paste resume text');
      return;
    }
    setUploading(true);
    try {
      let id;
      if (file) {
        const fd = new FormData();
        fd.append('resume', file);
        const res = await resumeAPI.upload(fd);
        id = res.data.data.resumeId;
        toast.success(`Uploaded: ${res.data.data.extractedData?.skillsFound || 0} skills detected`);
      } else {
        // text upload via analyze directly
        id = null;
      }
      setResumeId(id);
      setStep(1);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!jobTarget) { toast.error('Please select a job target'); return; }
    setLoading(true);
    try {
      const payload = {
        jobTarget,
        includeAI: true,
        ...(resumeId ? { resumeId } : { resumeText: text }),
      };
      const res = await resumeAPI.analyze(payload);
      setResult(res.data.data);
      setStep(2);
      toast.success('Analysis complete! 🎯');
    } catch (err) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0); setFile(null); setText(''); setJobTarget('');
    setResumeId(null); setResult(null);
  };

  return (
    <div className="upload-page">
      {/* Step Progress */}
      <div className="steps-bar">
        {STEPS.map((s, i) => (
          <div key={s} className={`step-item ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
            <div className="step-circle">{i < step ? '✓' : i + 1}</div>
            <span className="step-label">{s}</span>
            {i < STEPS.length - 1 && <div className="step-line" />}
          </div>
        ))}
      </div>

      {/* Step 0: Upload */}
      {step === 0 && (
        <div className="upload-step animate-fade">
          <div
            className={`drop-zone ${drag ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => !file && fileRef.current.click()}
          >
            {file ? (
              <div className="file-selected">
                <span className="file-icon">📄</span>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setFile(null); }}>
                  ✕ Remove
                </button>
              </div>
            ) : (
              <>
                <span className="drop-icon">📂</span>
                <h3>Drop your resume here</h3>
                <p>Supports PDF and TXT files up to 5MB</p>
                <button className="btn btn-secondary" onClick={e => { e.stopPropagation(); fileRef.current.click(); }}>
                  Browse Files
                </button>
              </>
            )}
          </div>

          <input ref={fileRef} type="file" accept=".pdf,.txt" hidden onChange={e => handleFileSelect(e.target.files[0])} />

          <div className="or-divider"><span>or paste text</span></div>

          <textarea
            className="form-input resume-textarea"
            placeholder="Paste your resume content here..."
            value={text}
            onChange={e => { setText(e.target.value); setFile(null); }}
            rows={8}
          />

          <button className="btn btn-primary btn-lg upload-btn" onClick={handleUpload} disabled={uploading || (!file && !text.trim())}>
            {uploading ? <><span className="spinner" style={{width:18,height:18}} /> Uploading...</> : 'Upload & Continue →'}
          </button>
        </div>
      )}

      {/* Step 1: Configure */}
      {step === 1 && (
        <div className="upload-step animate-fade">
          <div className="card configure-card">
            <h3>Select Your Target Job Role</h3>
            <p className="card-sub">We'll analyze your resume against the requirements for this role</p>

            {jobRoles.length > 0 ? (
              <div className="job-roles-grid">
                {jobRoles.map(role => (
                  <button
                    key={role.key}
                    className={`job-role-btn ${jobTarget === role.key ? 'selected' : ''}`}
                    onClick={() => setJobTarget(role.key)}
                  >
                    <span className="role-name">{role.displayName}</span>
                    <span className="role-skills">{role.requiredSkills?.length || 0} required skills</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Job Target</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Software Engineer, Data Scientist..."
                  value={jobTarget}
                  onChange={e => setJobTarget(e.target.value)}
                />
              </div>
            )}

            <div className="configure-actions">
              <button className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || !jobTarget}>
                {loading ? <><span className="spinner" style={{width:16,height:16}} /> Analyzing with AI...</> : '🚀 Analyze Resume'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Results */}
      {step === 2 && result && (
        <div className="results-page animate-fade">
          <div className="results-header">
            <h2>Analysis Complete</h2>
            <p>Target: <strong>{result.jobTarget?.displayName}</strong></p>
            <div className="results-header-actions">
              <button className="btn btn-secondary" onClick={reset}>New Analysis</button>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>View Dashboard →</button>
            </div>
          </div>

          {/* Score summary */}
          <div className="results-scores">
            <div className="card result-score-card">
              <ScoreRing score={result.scores?.jobScore || 0} size={140} color="auto" label="Job Match" />
              <div className="result-score-info">
                <div className="result-score-title">{result.scores?.interpretation}</div>
                <div className="result-score-sub">Overall job fit score</div>
              </div>
            </div>
            <div className="scores-breakdown">
              {[
                { label: 'ATS / Completeness', val: result.scores?.completenessScore, color: 'blue' },
                { label: 'Resume Quality',     val: result.scores?.resumeScore,       color: 'violet' },
                { label: 'Job Fit Score',      val: result.scores?.jobScore,          color: 'green' },
                { label: 'Experience Score',   val: result.scores?.experienceScore,   color: 'amber' },
              ].map(s => (
                <div key={s.label} className="score-bar-item">
                  <div className="flex-between" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{Math.round(s.val || 0)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill progress-fill-${s.color}`}
                      style={{ width: `${s.val || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="results-skills card">
            <h3 className="card-title">Skill Analysis — {Math.round(result.skillAnalysis?.matchPercentage || 0)}% match</h3>
            <div className="skill-analysis-grid">
              <div>
                <div className="skills-group-label" style={{marginBottom:8}}>
                  <span className="dot dot-green" /> Matched Skills ({result.skillAnalysis?.matchedSkills?.length || 0})
                </div>
                <div className="skill-tags">
                  {(result.skillAnalysis?.matchedSkills || []).map(s => (
                    <span key={s} className="skill-tag skill-tag-green">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="skills-group-label" style={{marginBottom:8}}>
                  <span className="dot dot-red" /> Missing Skills ({result.skillAnalysis?.missingSkills?.length || 0})
                </div>
                <div className="skill-tags">
                  {(result.skillAnalysis?.missingSkills || []).map(s => (
                    <span key={s} className="skill-tag skill-tag-red">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feedback */}
          {result.feedback?.suggestions?.length > 0 && (
            <div className="card">
              <h3 className="card-title">💡 Suggestions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.feedback.suggestions.map((s, i) => (
                  <div key={i} className="feedback-item feedback-green">
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.8rem' }}>{i + 1}.</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
