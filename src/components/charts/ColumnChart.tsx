import { useMemo, useState } from 'react'
import { useElementWidth } from '../../lib/useElementWidth'
import { fmtPct } from '../../lib/format'

export interface Column {
  key: string
  label: string
  full?: string
  v: number | null
  /** Второе значение — изменение цены на споте (тонкая колонка). */
  v2?: number | null
  meta?: string
}

interface Props {
  data: Column[]
  height?: number
  v2Label?: string
  vLabel?: string
  ariaLabel: string
  onPick?: (key: string) => void
  /** Формат значения в подсказке. По умолчанию — процент со знаком. */
  format?: (v: number) => string
  /** Одноцветные колонки (для распределений). */
  mono?: boolean
}

/** Колонки по месяцам: зеленые — плюс, красные — минус; тонкая серая — спот. */
export function ColumnChart({ data, height = 220, v2Label = 'Спот', vLabel = 'Алгоритм', ariaLabel, onPick, format = (v) => fmtPct(v), mono = false }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const has2 = data.some((d) => d.v2 != null)

  const g = useMemo(() => {
    const padL = 40
    const padR = 6
    const padT = 12
    const padB = 24
    const w = Math.max(10, width - padL - padR)
    const h = height - padT - padB
    const vals = data.flatMap((d) => [d.v ?? 0, d.v2 ?? 0])
    let min = Math.min(0, ...vals)
    let max = Math.max(1, ...vals)
    const span = max - min
    const step = span > 60 ? 20 : span > 30 ? 10 : span > 12 ? 5 : 2
    min = Math.floor(min / step) * step
    max = Math.ceil(max / step) * step
    const ticks: number[] = []
    for (let v = min; v <= max; v += step) ticks.push(v)
    const slot = w / Math.max(1, data.length)
    const bw = Math.min(28, slot * (has2 ? 0.46 : 0.62))
    const y = (v: number) => padT + (1 - (v - min) / (max - min)) * h
    return { padL, padT, padB, w, h, min, max, ticks, slot, bw, y }
  }, [data, width, height, has2])

  const every = Math.ceil(data.length / Math.max(1, Math.floor(g.w / 34)))
  const hp = hover != null ? data[hover] : null
  const hx = hover != null ? g.padL + g.slot * hover + g.slot / 2 : 0

  return (
    <div ref={ref} className="chart-box" style={{ height }}>
      <svg width={width} height={height} role="img" aria-label={ariaLabel}>
        {g.ticks.map((t) => (
          <g key={t}>
            <line x1={g.padL} x2={g.padL + g.w} y1={g.y(t)} y2={g.y(t)} stroke={t === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'} />
            <text x={g.padL - 7} y={g.y(t) + 4} textAnchor="end" fontSize="11" fill="var(--mut)">
              {t}%
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = g.padL + g.slot * i + g.slot / 2
          const y0 = g.y(0)
          const v = d.v ?? 0
          const yv = g.y(v)
          const x1 = has2 ? cx - g.bw / 2 - 2 : cx - g.bw / 2
          const dim = hover != null && hover !== i
          return (
            <g key={d.key} opacity={dim ? 0.45 : 1} style={{ transition: 'opacity .15s' }}>
              {has2 && d.v2 != null && (
                <rect
                  x={cx + 2}
                  y={Math.min(g.y(d.v2), y0)}
                  width={Math.max(3, g.bw * 0.45)}
                  height={Math.max(1, Math.abs(g.y(d.v2) - y0))}
                  rx="2"
                  fill="rgba(139,155,184,0.45)"
                />
              )}
              {d.v != null && (
                <rect
                  x={x1}
                  y={Math.min(yv, y0)}
                  width={has2 ? g.bw * 0.8 : g.bw}
                  height={Math.max(1.5, Math.abs(yv - y0))}
                  rx="3"
                  fill={mono ? 'url(#col-acc)' : v >= 0 ? 'url(#col-up)' : 'url(#col-down)'}
                />
              )}
              {i % every === 0 && (
                <text x={cx} y={height - 7} textAnchor="middle" fontSize="11" fill="var(--mut)">
                  {d.label}
                </text>
              )}
            </g>
          )
        })}
        <defs>
          <linearGradient id="col-up" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#34d399" />
            <stop offset="1" stopColor="#34d399" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="col-acc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#a78bfa" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="col-down" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#fb7185" />
            <stop offset="1" stopColor="#fb7185" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        {data.map((d, i) => (
          <rect
            key={`h-${d.key}`}
            x={g.padL + g.slot * i}
            y={0}
            width={g.slot}
            height={height - g.padB}
            fill="transparent"
            style={{ cursor: onPick ? 'pointer' : 'default' }}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            onClick={() => onPick?.(d.key)}
          />
        ))}
      </svg>
      {hp && (
        <div className="chart-tip" style={hx > width * 0.6 ? { right: width - hx + 12 } : { left: hx + 12 }}>
          <div className="chart-tip-date">{hp.full ?? hp.label}</div>
          <div className="chart-tip-row">
            <i style={{ background: mono ? '#a78bfa' : (hp.v ?? 0) >= 0 ? '#34d399' : '#fb7185' }} />
            <span>{vLabel}</span>
            <b className={mono ? '' : (hp.v ?? 0) >= 0 ? 'up' : 'down'}>{hp.v == null ? '—' : format(hp.v)}</b>
          </div>
          {has2 && (
            <div className="chart-tip-row">
              <i style={{ background: 'rgba(139,155,184,0.7)' }} />
              <span>{v2Label}</span>
              <b className={(hp.v2 ?? 0) >= 0 ? 'up' : 'down'}>{hp.v2 == null ? '—' : fmtPct(hp.v2)}</b>
            </div>
          )}
          {hp.meta && <div className="chart-tip-meta">{hp.meta}</div>}
        </div>
      )}
    </div>
  )
}
