import type { DayStat } from '../../api/types'
import { daysInMonth, parseISODate, WEEKDAYS_SHORT, ymParts } from '../../lib/dates'
import { fmtNum, fmtPct, plural } from '../../lib/format'

/** Календарь месяца: каждый день — итог в процентах, как «Календарь» статистики кабинета. */
export function MonthCalendar({ ym, days }: { ym: string; days: DayStat[] }) {
  const { year, month0 } = ymParts(ym)
  const n = daysInMonth(year, month0)
  const offset = (new Date(year, month0, 1).getDay() + 6) % 7
  const map = new Map(days.map((d) => [d.d, d]))
  const max = Math.max(...days.map((d) => Math.abs(d.pct)), 0.01)
  const cells: (DayStat | { d: string; empty: true } | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let i = 1; i <= n; i++) {
    const iso = `${ym}-${String(i).padStart(2, '0')}`
    cells.push(map.get(iso) ?? { d: iso, empty: true })
  }
  return (
    <div className="mcal" role="table" aria-label="Итоги по дням">
      <div className="mcal-row mcal-head" role="row">
        {WEEKDAYS_SHORT.map((w) => (
          <div key={w} role="columnheader">
            {w}
          </div>
        ))}
      </div>
      <div className="mcal-grid">
        {cells.map((c, i) => {
          if (!c) return <div key={`e${i}`} className="mcal-cell pad" aria-hidden="true" />
          const day = parseISODate(c.d).getDate()
          if ('empty' in c) {
            return (
              <div key={c.d} className="mcal-cell future" role="cell">
                <span className="mcal-day">{day}</span>
              </div>
            )
          }
          const a = 0.1 + 0.55 * Math.min(1, Math.abs(c.pct) / max)
          return (
            <div
              key={c.d}
              className="mcal-cell"
              role="cell"
              title={`${day}: ${fmtPct(c.pct)} · ${fmtNum(c.trades)} ${plural(c.trades, 'сделка', 'сделки', 'сделок')}`}
              style={{ background: c.pct >= 0 ? `rgba(52,211,153,${a.toFixed(2)})` : `rgba(251,113,133,${Math.max(0.35, a).toFixed(2)})` }}
            >
              <span className="mcal-day">{day}</span>
              <b className="num">{fmtPct(c.pct)}</b>
              <small>{fmtNum(c.trades)}</small>
            </div>
          )
        })}
      </div>
    </div>
  )
}
