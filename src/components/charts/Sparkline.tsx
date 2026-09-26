/** Мини-график «Динамика» — накопленный результат по месяцам, как в таблице «По ботам» кабинета. */
export function Sparkline({ values, width = 84, height = 24, cumulative = true }: { values: number[]; width?: number; height?: number; cumulative?: boolean }) {
  if (!values.length) return null
  let acc = 0
  const pts = cumulative ? values.map((v) => (acc += v)) : values
  const min = Math.min(0, ...pts)
  const max = Math.max(...pts, min + 0.001)
  const x = (i: number) => (i / Math.max(1, pts.length - 1)) * (width - 4) + 2
  const y = (v: number) => 2 + (1 - (v - min) / (max - min)) * (height - 4)
  const line = pts.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const lastUp = pts[pts.length - 1] >= 0
  return (
    <svg width={width} height={height} className="spark" aria-hidden="true">
      {min < 0 && <line x1="0" x2={width} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,0.12)" strokeDasharray="2 2" />}
      <polyline points={line} fill="none" stroke={lastUp ? '#a78bfa' : '#fb7185'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1])} r="2" fill={lastUp ? '#a78bfa' : '#fb7185'} />
    </svg>
  )
}
