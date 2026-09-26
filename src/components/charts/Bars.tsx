import type { ReactNode } from 'react'

export interface BarItem {
  key: string
  label: ReactNode
  value: number
  display: ReactNode
  tone?: 'up' | 'down' | 'acc'
}

/** Горизонтальные бары «По монетам» / «По стадиям» — как в статистике кабинета. Отрицательные идут влево от нуля. */
export function Bars({ items, onPick, ariaLabel }: { items: BarItem[]; onPick?: (key: string) => void; ariaLabel?: string }) {
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 0.0001)
  const hasNeg = items.some((i) => i.value < 0)
  const zero = hasNeg ? 30 : 0
  return (
    <div className="pub-bars" role="list" aria-label={ariaLabel}>
      {items.map((it) => {
        const pct = (Math.abs(it.value) / max) * (100 - zero)
        const tone = it.tone ?? (it.value >= 0 ? 'up' : 'down')
        const grad =
          tone === 'acc'
            ? 'linear-gradient(90deg, rgba(167,139,250,.35), #a78bfa)'
            : tone === 'up'
              ? 'linear-gradient(90deg, rgba(52,211,153,.35), #34d399)'
              : 'linear-gradient(270deg, rgba(251,113,133,.35), #fb7185)'
        const left = it.value >= 0 ? zero : zero - (Math.abs(it.value) / max) * zero
        const width = it.value >= 0 ? pct : (Math.abs(it.value) / max) * zero
        return (
          <div
            key={it.key}
            role="listitem"
            className={`pair-row ${onPick ? 'clickable' : ''}`}
            onClick={onPick ? () => onPick(it.key) : undefined}
            onKeyDown={onPick ? (e) => (e.key === 'Enter' || e.key === ' ') && onPick(it.key) : undefined}
            tabIndex={onPick ? 0 : undefined}
          >
            <div className="pair-sym">{it.label}</div>
            <div className="pair-bar-t">
              {hasNeg && <span className="pair-zero" style={{ left: `${zero}%` }} />}
              <div className="pair-bar" style={{ left: `calc(${left}% + 1px)`, width: `${Math.max(width, 0.8)}%`, background: grad }} />
            </div>
            <div className={`pair-val num ${tone === 'acc' ? '' : tone}`}>{it.display}</div>
          </div>
        )
      })}
    </div>
  )
}
