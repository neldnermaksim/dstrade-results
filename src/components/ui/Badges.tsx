import type { Direction, RiskLevel, StageKey } from '../../api/types'
import { RISK, STAGES } from '../../content/dictionary'

export function StageBadge({ stage, title }: { stage: StageKey; title?: string }) {
  const s = STAGES[stage]
  return (
    <span className={`stage-badge ${s.tone}`} title={title ?? `${s.name} — ${s.desc}`}>
      {s.name}
    </span>
  )
}

export function DirBadge({ dir }: { dir: Direction | 'ALL' | null }) {
  if (!dir || dir === 'ALL') return <span className="dir-badge all">L + S</span>
  return <span className={`dir-badge ${dir === 'SHORT' ? 'short' : ''}`}>{dir}</span>
}

/** Буква стратегии — как «M» / «A» рядом с монетой в обзоре кабинета. */
export function StrategyLetter({ auto }: { auto: boolean }) {
  return (
    <span className="strat-badge" title={auto ? 'DCA · Auto' : 'DCA · Manual'}>
      {auto ? 'A' : 'M'}
    </span>
  )
}

export function PlusMark() {
  return (
    <svg className="pub-plus-mark" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7.2" fill="#f4d7a2" />
      <path d="M8 4.4v7.2M4.4 8h7.2" stroke="#2a2113" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  )
}

export function PlusBadge() {
  return (
    <span className="pub-plus-brand">
      <PlusMark />
      Plus
    </span>
  )
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const r = RISK[risk]
  const level = risk === 'moderate' ? 1 : risk === 'elevated' ? 2 : 3
  return (
    <span className={`risk-badge ${r.tone}`}>
      <i aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <b key={n} className={n <= level ? 'on' : ''} />
        ))}
      </i>
      <span className={r.tone}>{r.label} риск</span>
    </span>
  )
}
