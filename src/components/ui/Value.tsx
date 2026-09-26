import { fmtPct, fmtUsd, toneOf } from '../../lib/format'

/** Процент со знаком и цветом. */
export function Pct({ v, digits = 2, className = '', neutral = false }: { v: number | null | undefined; digits?: number; className?: string; neutral?: boolean }) {
  if (v == null) return <span className={`mut2 ${className}`}>—</span>
  return <span className={`num ${neutral ? '' : toneOf(v)} ${className}`}>{fmtPct(v, digits)}</span>
}

export function Usd({ v, digits = 2, className = '' }: { v: number; digits?: number; className?: string }) {
  return <span className={`num ${toneOf(v)} ${className}`}>{fmtUsd(v, digits)}</span>
}
