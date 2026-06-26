import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { resumeAPI } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import toast from 'react-hot-toast';
import './Progress.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="tooltip-item" style={{ color: p.color }}>
          <span className="tooltip-dot" style={{ background: p.color }} />
          {p.name}: <strong>{Math.round(p.value)}%</strong>
        </div>
      ))}
    </div>
  );
};

export default function Progress() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id && !user?.id) { setLoading(false); return; }
    const uid = user._id || user.id;
    resumeAPI.getProgress(uid)
      .then(res => setData(res.data.data))
      .catch(err => {
        if (err.response?.status !== 403) toast.error('Failed to load progress');
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  const timeline = data?.timeline || [];
  const improvements = data?.improvements || [];
  const summary = data?.summary || {};

  // Prepare chart data
  const chartData = timeline.map(t => ({
    name: t.label || `v${t.version}`,
    'Overall Score':      t.scores?.overall          || 0,
    'Resume Quality':     t.scores?.resumeScore       || 0,
    'Job Match':          t.scores?.jobScore          || 0,
    'Skill Match':        t.skillMatchPercentage      || 0,
  }));

  const statCards = [
    { label: 'First Score',       val: `${summary.firstScore || 0}%`,  color: 'var(--text-muted)', icon: '🏁' },
    { label: 'Latest Score',      val: `${summary.latestScore || 0}%`, color: 'var(--accent)', icon: '📊' },
    { label: 'Total Improvement', val: `+${Math.max(summary.totalImprovement || 0, 0)}%`, color: 'var(--accent-bright)', icon: '📈' },
    { label: 'Resumes Analyzed',  val: data?.totalResumes || 0,        color: '#e88070', icon: '📄' },
  ];

  return (
    <div className="progress-page">
      {/* Summary Cards */}
      {data?.totalResumes > 0 && (
        <>
          <div className="prog-summary-cards">
            {statCards.map(s => (
              <div key={s.label} className="prog-stat-card" style={{ '--accent': s.color }}>
                <div className="prog-stat-icon">{s.icon}</div>
                <div className="prog-stat-val">{s.val}</div>
                <div className="prog-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Status Banner */}
          <div className="prog-status-banner">
            <span className="prog-status-icon">🚀</span>
            <span>{summary.improvementStatus || 'Keep improving!'}</span>
          </div>

          {/* Charts */}
          {chartData.length >= 2 && (
            <>
              <div className="card prog-chart-card">
                <h3 className="card-title">Score Progress Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3d9142" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3d9142" stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="colorJob" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#2a7a6a" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2a7a6a" stopOpacity={0}    />
                      </linearGradient>
                      <linearGradient id="colorSkill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#b8860b" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#b8860b" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ paddingTop: 16, fontSize: '0.78rem', color: '#94a3b8' }}
                      iconType="circle"
                    />
                    <Area type="monotone" dataKey="Overall Score"  stroke="#52b85a" strokeWidth={2.5} fill="url(#colorOverall)" dot={{ r: 4, fill: '#52b85a' }} activeDot={{ r: 6 }} />
                    <Area type="monotone" dataKey="Job Match"      stroke="#2a9e8a" strokeWidth={2}   fill="url(#colorJob)"     dot={{ r: 4, fill: '#2a9e8a' }} activeDot={{ r: 6 }} />
                    <Area type="monotone" dataKey="Skill Match"    stroke="#e8c060" strokeWidth={2}   fill="url(#colorSkill)"   dot={{ r: 4, fill: '#e8c060' }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Resume Quality line chart */}
              <div className="card prog-chart-card">
                <h3 className="card-title">Resume Quality Score</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Resume Quality" stroke="#52b85a" strokeWidth={2.5} dot={{ r: 5, fill: '#52b85a', strokeWidth: 0 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* Timeline */}
          <div className="card prog-timeline-card">
            <h3 className="card-title">Version Timeline</h3>
            <div className="prog-timeline">
              {timeline.map((t, i) => (
                <div key={t.resumeId} className="timeline-item">
                  <div className="timeline-dot-col">
                    <div className="timeline-dot" />
                    {i < timeline.length - 1 && <div className="timeline-line" />}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-label">{t.label}</span>
                      <span className="timeline-date">
                        {new Date(t.analyzedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="timeline-job">{t.jobTarget}</div>
                    <div className="timeline-scores">
                      {[
                        { label: 'Overall', val: t.scores?.overall || 0 },
                        { label: 'Resume',  val: t.scores?.resumeScore || 0 },
                        { label: 'Job Fit', val: t.scores?.jobScore || 0 },
                      ].map(s => (
                        <div key={s.label} className="timeline-score-pill">
                          <span className="timeline-score-label">{s.label}</span>
                          <span className="timeline-score-val">{Math.round(s.val)}%</span>
                        </div>
                      ))}
                    </div>
                    {improvements[i - 1] && (
                      <div className={`timeline-delta ${improvements[i-1].improved ? 'delta-up' : 'delta-down'}`}>
                        {improvements[i-1].message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Still missing skills */}
          {summary.stillMissingSkills?.length > 0 && (
            <div className="card prog-missing-card">
              <h3 className="card-title">⚠️ Still Missing Skills — Focus on These</h3>
              <div className="skill-tags" style={{ marginTop: 8 }}>
                {summary.stillMissingSkills.map(s => (
                  <span key={s} className="skill-tag skill-tag-red">{s}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {(!data || data.totalResumes === 0) && !loading && (
        <div className="prog-empty">
          <div className="prog-empty-icon">📈</div>
          <h3>No Progress Data Yet</h3>
          <p>Upload and analyze at least one resume to start tracking your career progress over time</p>
        </div>
      )}
    </div>
  );
}
