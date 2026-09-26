import type { CloseReason } from '../../api/types'
import { CLOSE_ORDER, CLOSE_REASONS } from '../../content/dictionary'
import { fmtNum } from '../../lib/format'
import { Hint } from '../ui/Hint'

/** Причины закрытия сделок: 100%-полоса и легенда с долями. */
export function CloseReasonsBar({ data }: { data: Record<CloseReason, number> }) {
  return (
    <div className="stackbar">
      <div className="stackbar-track" role="img" aria-label={CLOSE_ORDER.map((k) => `${CLOSE_REASONS[k].label} ${fmtNum(data[k], 1)}%`).join(', ')}>
        {CLOSE_ORDER.map((k) => (
          <span key={k} style={{ width: `${Math.max(data[k], 0.6)}%`, background: CLOSE_REASONS[k].color }} title={`${CLOSE_REASONS[k].label}: ${fmtNum(data[k], 2)}%`} />
        ))}
      </div>
      <div className="stackbar-legend">
        {CLOSE_ORDER.map((k) => (
          <div key={k} className="stackbar-item">
            <i style={{ background: CLOSE_REASONS[k].color }} />
            <span>{CLOSE_REASONS[k].label}</span>
            <Hint label={`Что такое «${CLOSE_REASONS[k].label}»`}>{CLOSE_REASONS[k].desc}</Hint>
            <b className="num">{fmtNum(data[k], data[k] < 1 ? 2 : 1)}%</b>
          </div>
        ))}
      </div>
    </div>
  )
}
