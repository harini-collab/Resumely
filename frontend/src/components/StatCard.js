import './StatCard.css';
export default function StatCard({ icon, label, value, sub, color = 'green', trend }) {
  const colors = {
    green:  { bg:'rgba(45,110,45,0.12)',   border:'rgba(61,145,66,0.2)',   val:'var(--green-200)' },
    blue:   { bg:'rgba(42,122,106,0.12)',  border:'rgba(42,122,106,0.22)', val:'#7dd4c4' },
    violet: { bg:'rgba(80,60,120,0.12)',   border:'rgba(80,60,120,0.22)',  val:'#c0a8f0' },
    amber:  { bg:'rgba(184,134,11,0.12)',  border:'rgba(184,134,11,0.2)',  val:'#e8c060' },
    rose:   { bg:'rgba(192,57,43,0.12)',   border:'rgba(192,57,43,0.2)',   val:'#e88070' },
    cyan:   { bg:'rgba(42,122,106,0.1)',   border:'rgba(42,122,106,0.18)', val:'#7dd4c4' },
  };
  const c = colors[color] || colors.green;
  return (
    <div className="stat-card" style={{'--c-bg':c.bg,'--c-border':c.border,'--c-val':c.val}}>
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        {trend !== undefined && (
          <span className={`stat-card-trend ${trend>=0?'up':'down'}`}>
            {trend>=0?'↑':'↓'}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
      <div className="stat-card-icon">{icon}</div>
    </div>
  );
}
