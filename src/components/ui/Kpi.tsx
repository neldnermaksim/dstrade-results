import type { ReactNode } from 'react'
import { Hint } from './Hint'

interface Props {
  label: ReactNode
  value: ReactNode
  tone?: 'up' | 'down' | ''
  sub?: ReactNode
  hint?: ReactNode
  meter?: number
  icon?: ReactNode
}

/** Плитка показателя — как «Сделок закрыто», «Доля прибыльных» в статистике кабинета. */
export function Kpi({ label, value, tone = '', sub, hint, meter, icon }: Props) {
  return (
    <div className="pub-kpi">
      <div className="lbl">
        {icon}
        <span>{label}</span>
        {hint && <Hint label={`Что такое «${typeof label === 'string' ? label : 'показатель'}»`}>{hint}</Hint>}
      </div>
      <div className={`val num ${tone}`}>{value}</div>
      {meter !== undefined && (
        <div className="meter" aria-hidden="true">
          <i style={{ width: `${Math.max(0, Math.min(100, meter))}%` }} />
        </div>
      )}
      {sub && <div className="sub">{sub}</div>}
    </div>
  )
}

export function KpiSkeleton({ n = 5 }: { n?: number }) {
  return (
    <div className="pub-kpis" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="pub-kpi">
          <div className="skel" style={{ width: '55%', height: 12 }} />
          <div className="skel" style={{ width: '70%', height: 26, marginTop: 12 }} />
          <div className="skel" style={{ width: '85%', height: 10, marginTop: 12 }} />
        </div>
      ))}
    </div>
  )
}
