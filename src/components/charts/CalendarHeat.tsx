import { useMemo, useState } from 'react'
import type { DayStat } from '../../api/types'
import { useElementWidth } from '../../lib/useElementWidth'
import { fmtDayMonth, MONTHS_SHORT, parseISODate, WEEKDAYS_SHORT } from '../../lib/dates'
import { fmtNum, fmtPct, plural } from '../../lib/format'

/** Календарь прибыли по дням — как в «Статистике» кабинета: зеленые и красные квадраты по неделям. */
export function CalendarHeat({ days, ariaLabel }: { days: DayStat[]; ariaLabel: string }) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const [hover, setHover] = useState<{ d: DayStat; x: number; y: number } | null>(null)

  const g = useMemo(() => {
    if (!days.length) return null
    const first = parseISODate(days[0].d)
    const offset = (first.getDay() + 6) % 7
    const weeks = Math.ceil((days.length + offset) / 7)
    const labelW = 24
    const gap = 3
    const cell = Math.max(8, Math.min(22, Math.floor((width - labelW) / weeks) - gap))
    const max = Math.max(...days.map((d) => Math.abs(d.pct)), 0.01)
    const cells = days.map((d, i) => {
      const k = i + offset
      return { d, x: labelW + Math.floor(k / 7) * (cell + gap), y: 18 + (k % 7) * (cell + gap) }
    })
    const months: { x: number; label: string }[] = []
    let lastM = -1
    cells.forEach((c) => {
      const dt = parseISODate(c.d.d)
      if (dt.getMonth() !== lastM && dt.getDate() <= 7) {
        months.push({ x: c.x, label: MONTHS_SHORT[dt.getMonth()] })
        lastM = dt.getMonth()
      }
    })
    const h = 18 + 7 * (cell + gap)
    return { cells, cell, max, months, h, w: labelW + weeks * (cell + gap) }
  }, [days, width])

  if (!g) return null
  const fill = (v: number) => {
    const a = 0.16 + 0.74 * Math.min(1, Math.abs(v) / g.max)
    return v >= 0 ? `rgba(52,211,153,${a.toFixed(2)})` : `rgba(251,113,133,${Math.max(0.5, a).toFixed(2)})`
  }

  return (
    <div ref={ref} className="chart-box cal-heat">
      <svg width={Math.min(width, g.w)} height={g.h} role="img" aria-label={ariaLabel}>
        {g.months.map((m, i) => (
          <text key={i} x={m.x} y={10} fontSize="10" fill="var(--mut2)">
            {m.label}
          </text>
        ))}
        {[0, 2, 4].map((r) => (
          <text key={r} x={0} y={18 + r * (g.cell + 3) + g.cell - 3} fontSize="9" fill="var(--mut2)">
            {WEEKDAYS_SHORT[r]}
          </text>
        ))}
        {g.cells.map((c) => (
          <rect
            key={c.d.d}
            x={c.x}
            y={c.y}
            width={g.cell}
            height={g.cell}
            rx="3"
            fill={fill(c.d.pct)}
            stroke={hover?.d.d === c.d.d ? 'rgba(255,255,255,0.8)' : 'none'}
            onPointerEnter={() => setHover({ d: c.d, x: c.x + g.cell / 2, y: c.y })}
            onPointerLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {hover && (
        <div className="chart-tip" style={hover.x > width * 0.6 ? { right: width - hover.x + 10, top: hover.y - 6 } : { left: hover.x + 12, top: hover.y - 6 }}>
          <div className="chart-tip-date">{fmtDayMonth(hover.d.d)}</div>
          <div className="chart-tip-row">
            <span>Итог дня</span>
            <b className={hover.d.pct >= 0 ? 'up' : 'down'}>{fmtPct(hover.d.pct)}</b>
          </div>
          <div className="chart-tip-meta">
            {fmtNum(hover.d.trades)} {plural(hover.d.trades, 'сделка', 'сделки', 'сделок')}
          </div>
        </div>
      )}
    </div>
  )
}
