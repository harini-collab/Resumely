export default function ScoreRing({ score = 0, size = 120, strokeWidth = 9, color = 'auto', label = '' }) {
  const radius = (size - strokeWidth) / 2;
  const circ   = 2 * Math.PI * radius;
  const pct    = Math.min(Math.max(score, 0), 100);
  const offset = circ - (pct / 100) * circ;

  const getColor = () => {
    if (pct >= 80) return '#52b85a';
    if (pct >= 60) return '#3d9142';
    if (pct >= 40) return '#b8860b';
    return '#c0392b';
  };

  const ringColor = color === 'auto' ? getColor() : color;

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* track */}
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        {/* fill */}
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={ringColor} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0,0,0.2,1)',
            filter: `drop-shadow(0 0 8px ${ringColor}80)`,
          }}
        />
      </svg>
      <div className="score-ring-value">
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 400,
          fontSize: size * 0.21,
          color: ringColor,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {Math.round(pct)}
        </span>
        {label && (
          <span style={{ fontSize: size * 0.085, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
