import type { ReactNode } from 'react'
import type { MatrixRow, MonthlyMatrix } from '../../api/types'
import { MONTHS, MONTHS_SHORT } from '../../lib/dates'
import { fmtNum } from '../../lib/format'

interface Props {
  matrix: MonthlyMatrix
  rowLabel: (r: MatrixRow) => ReactNode
  firstCol: string
  currentYM?: string
  onPickRow?: (r: MatrixRow) => void
}

const cellStyle = (v: number, scale: number) => {
  const k = Math.min(1, Math.abs(v) / scale)
  const a = 0.08 + 0.62 * k
  if (v >= 0) return { background: `rgba(52,211,153,${a.toFixed(3)})`, color: k > 0.72 ? '#03150d' : 'var(--txt)' }
  return { background: `rgba(251,113,133,${Math.max(0.28, a).toFixed(3)})`, color: k > 0.72 ? '#2a0710' : 'var(--txt)' }
}

const n2 = (v: number) => {
  const s = fmtNum(v, 2)
  return v > 0 ? s : s
}

/** Таблица «Месяц / строка» с цветом ячеек — как годовые листы таблицы доходности. */
export function HeatTable({ matrix, rowLabel, firstCol, currentYM, onPickRow }: Props) {
  const all = [...matrix.rows, matrix.footer].flatMap((r) => r.values.filter((v): v is number => v != null))
  const sorted = [...all].map(Math.abs).sort((a, b) => a - b)
  const scale = Math.max(1, sorted[Math.floor(sorted.length * 0.92)] ?? 1)
  const curIdx = currentYM && Number(currentYM.slice(0, 4)) === matrix.year ? Number(currentYM.slice(5, 7)) - 1 : -1

  const row = (r: MatrixRow, foot = false) => (
    <tr key={r.key} className={onPickRow && !foot ? 'clickable' : ''} onClick={onPickRow && !foot ? () => onPickRow(r) : undefined}>
      <td className="l">{foot ? r.label : rowLabel(r)}</td>
      {r.values.map((v, i) =>
        v == null ? (
          <td key={i} className="cell empty">
            —
          </td>
        ) : (
          <td key={i} className="cell num" style={cellStyle(v, scale)} title={`${MONTHS[i]}${i === curIdx ? ' (месяц идет)' : ''}: ${fmtNum(v, 2)}%`}>
            {n2(v)}
            {i === curIdx && <sup className="heat-cur" aria-label="месяц идет">•</sup>}
          </td>
        ),
      )}
      <td className="tot num">{fmtNum(r.total, 2)}</td>
      <td className="avg num">{fmtNum(r.avg, 2)}</td>
    </tr>
  )

  return (
    <div className="pub-table-wrap heat-wrap">
      <table className="pub-heat">
        <thead>
          <tr>
            <th className="l" scope="col">
              {firstCol}
            </th>
            {MONTHS_SHORT.map((m, i) => (
              <th key={m} scope="col" className={i === curIdx ? 'cur' : ''}>
                {m}
              </th>
            ))}
            <th scope="col">Итого, %</th>
            <th scope="col">В месяц</th>
          </tr>
        </thead>
        <tbody>{matrix.rows.map((r) => row(r))}</tbody>
        <tfoot>{row(matrix.footer, true)}</tfoot>
      </table>
    </div>
  )
}
