import { useId, useMemo, useState } from 'react'
import { useElementWidth } from '../../lib/useElementWidth'
import { fmtDate, fmtDateShort, MONTHS_SHORT, parseISODate } from '../../lib/dates'
import { fmtNum, fmtPct } from '../../lib/format'

export interface AreaPoint {
  t: string
  v: number
  b?: number
}

interface Props {
  data: AreaPoint[]
  height?: number
  /** Показать пунктир BTC на споте. */
  bench?: boolean
  benchLabel?: string
  valueLabel?: string
  /** Ось значений справа (как в окне-превью на главной) или слева (как в статистике кабинета). */
  axis?: 'left' | 'right'
  /** Бегущая подсветка — как на графике главной dstrade.io. */
  sweep?: boolean
  endLabel?: boolean
  ariaLabel: string
}

function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1e-9))))
  const n = raw / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p
}

const axisFmt = (v: number) => {
  const a = Math.abs(v)
  const s = a >= 1000 ? `${fmtNum(v / 1000, a >= 10000 ? 0 : 1)}k` : fmtNum(v, a < 10 && v % 1 !== 0 ? 1 : 0)
  return `${s}%`
}

/** Накопленный результат: площадь под линией индекса + пунктир BTC. */
export function AreaChart({ data, height = 240, bench = false, benchLabel = 'BTC спот', valueLabel = 'Индекс DSTrade', axis = 'left', sweep = false, endLabel = true, ariaLabel }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  const g = useMemo(() => {
    const padL = axis === 'left' ? 52 : 8
    const padR = axis === 'right' ? 54 : 14
    const padT = endLabel ? 24 : 12
    const padB = 26
    const w = Math.max(10, width - padL - padR)
    const h = Math.max(10, height - padT - padB)
    const vals = data.flatMap((d) => (bench && d.b !== undefined ? [d.v, d.b] : [d.v]))
    let min = Math.min(0, ...vals)
    let max = Math.max(0, ...vals)
    if (max - min < 1) max = min + 1
    const step = niceStep((max - min) / 4)
    min = Math.floor(min / step) * step
    max = Math.ceil(max / step) * step
    const ticks: number[] = []
    for (let v = min; v <= max + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000)
    const n = Math.max(1, data.length - 1)
    const x = (i: number) => padL + (i / n) * w
    const y = (v: number) => padT + (1 - (v - min) / (max - min)) * h
    const line = data.map((d, i) => `${x(i).toFixed(1)},${y(d.v).toFixed(1)}`).join(' ')
    const area = data.length ? `${x(0).toFixed(1)},${y(Math.max(min, 0)).toFixed(1)} ${line} ${x(data.length - 1).toFixed(1)},${y(Math.max(min, 0)).toFixed(1)}` : ''
    const bline = bench ? data.map((d, i) => `${x(i).toFixed(1)},${y(d.b ?? 0).toFixed(1)}`).join(' ') : ''
    const spanDays = data.length
    const labelCount = Math.max(2, Math.min(7, Math.floor(w / 110)))
    const xl: { x: number; text: string }[] = []
    for (let k = 0; k < labelCount; k++) {
      const i = Math.round((k / (labelCount - 1)) * n)
      const t = data[i]?.t
      if (!t) continue
      const dt = parseISODate(t)
      xl.push({ x: x(i), text: spanDays > 200 ? `${MONTHS_SHORT[dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}` : fmtDateShort(t) })
    }
    return { padL, padR, padT, padB, w, h, min, max, ticks, x, y, line, area, bline, xl }
  }, [data, width, height, bench, axis, endLabel])

  const last = data[data.length - 1]
  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = (e.currentTarget as SVGRectElement).getBoundingClientRect()
    const px = e.clientX - r.left
    const i = Math.round((px / r.width) * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }

  const hp = hover != null ? data[hover] : null
  const tipLeft = hover != null ? g.x(hover) : 0
  const tipRight = tipLeft > width * 0.62

  return (
    <div ref={ref} className="chart-box" style={{ height }}>
      <svg width={width} height={height} role="img" aria-label={ariaLabel}>
        <defs>
          <linearGradient id={`ga-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.32" />
            <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`sw-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#a78bfa" stopOpacity="0" />
            <stop offset="0.5" stopColor="#c4b5fd" stopOpacity="0.09" />
            <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`cl-${uid}`}>
            <rect x={g.padL} y={0} width={g.w} height={height - g.padB} />
          </clipPath>
        </defs>
        {g.ticks.map((t) => (
          <g key={t}>
            <line x1={g.padL} x2={g.padL + g.w} y1={g.y(t)} y2={g.y(t)} stroke={t === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)'} />
            <text
              x={axis === 'left' ? g.padL - 8 : g.padL + g.w + 8}
              y={g.y(t) + 4}
              textAnchor={axis === 'left' ? 'end' : 'start'}
              fontSize="11"
              fill="var(--mut)"
            >
              {axisFmt(t)}
            </text>
          </g>
        ))}
        {g.xl.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={height - 7}
            textAnchor={i === 0 ? 'start' : i === g.xl.length - 1 ? 'end' : 'middle'}
            fontSize="11"
            fill="var(--mut)"
          >
            {l.text}
          </text>
        ))}
        <g clipPath={`url(#cl-${uid})`}>
          {data.length > 1 && <polygon points={g.area} fill={`url(#ga-${uid})`} />}
          {sweep && (
            <rect className="chart-sweep" x={g.padL - 120} y={g.padT} width="120" height={g.h} fill={`url(#sw-${uid})`} style={{ ['--sweep' as string]: `${g.w}px` }} />
          )}
          {bench && data.length > 1 && (
            <polyline points={g.bline} fill="none" stroke="var(--mut)" strokeOpacity="0.8" strokeWidth="1.5" strokeDasharray="4 4" strokeLinejoin="round" />
          )}
          {data.length > 1 && <polyline points={g.line} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        </g>
        {last && endLabel && hover == null && (
          <>
            <circle cx={g.x(data.length - 1)} cy={g.y(last.v)} r="4" fill="#a78bfa" stroke="#070b14" strokeWidth="2" className="chart-end" />
            <text
              x={g.x(data.length - 1) - 8}
              y={g.y(last.v) - 10}
              textAnchor="end"
              fontSize="11"
              fontWeight="700"
              fill={last.v >= 0 ? '#34d399' : '#fb7185'}
            >
              {fmtPct(last.v)}
            </text>
          </>
        )}
        {hp && hover != null && (
          <g pointerEvents="none">
            <line x1={g.x(hover)} x2={g.x(hover)} y1={g.padT} y2={g.padT + g.h} stroke="rgba(255,255,255,0.22)" strokeDasharray="3 3" />
            {bench && hp.b !== undefined && <circle cx={g.x(hover)} cy={g.y(hp.b)} r="3.5" fill="var(--mut)" stroke="#070b14" strokeWidth="2" />}
            <circle cx={g.x(hover)} cy={g.y(hp.v)} r="4.5" fill="#a78bfa" stroke="#070b14" strokeWidth="2" />
          </g>
        )}
        <rect
          x={g.padL}
          y={0}
          width={g.w}
          height={height - g.padB}
          fill="transparent"
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      {hp && hover != null && (
        <div className="chart-tip" style={tipRight ? { right: width - tipLeft + 12 } : { left: tipLeft + 12 }}>
          <div className="chart-tip-date">{fmtDate(hp.t)}</div>
          <div className="chart-tip-row">
            <i style={{ background: '#a78bfa' }} />
            <span>{valueLabel}</span>
            <b className={hp.v >= 0 ? 'up' : 'down'}>{fmtPct(hp.v)}</b>
          </div>
          {bench && hp.b !== undefined && (
            <div className="chart-tip-row">
              <i className="dash" />
              <span>{benchLabel}</span>
              <b className={hp.b >= 0 ? 'up' : 'down'}>{fmtPct(hp.b)}</b>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
