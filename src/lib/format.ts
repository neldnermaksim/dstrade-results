const MINUS = '−'

const nf = (digits: number) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: digits })

const cache = new Map<number, Intl.NumberFormat>()
const fmt = (v: number, digits: number) => {
  let f = cache.get(digits)
  if (!f) {
    f = nf(digits)
    cache.set(digits, f)
  }
  return f.format(Math.abs(v))
}

/** Число с разрядами: 48 213 · 1 725,49 */
export function fmtNum(v: number, digits = 0): string {
  const s = fmt(v, digits)
  return v < 0 && Number(s.replace(/\s/g, '').replace(',', '.')) !== 0 ? MINUS + s : s
}

/** Процент со знаком: +6,35% · −1,20% · 0,00% */
export function fmtPct(v: number, digits = 2, sign = true): string {
  const s = fmt(v, digits)
  const zero = Number(s.replace(/\s/g, '').replace(',', '.')) === 0
  if (zero) return `${s}%`
  if (v < 0) return `${MINUS}${s}%`
  return `${sign ? '+' : ''}${s}%`
}

/** Сумма в долларах: +1 725,49 $ */
export function fmtUsd(v: number, digits = 2, sign = true): string {
  const s = fmt(v, digits)
  if (v < 0) return `${MINUS}${s} $`
  return `${sign && v > 0 ? '+' : ''}${s} $`
}

/** Компактно: 1,2 млн · 48,3 тыс. */
export function fmtCompact(v: number, digits = 1): string {
  const a = Math.abs(v)
  if (a >= 1e9) return `${fmtNum(v / 1e9, digits)} млрд`
  if (a >= 1e6) return `${fmtNum(v / 1e6, digits)} млн`
  if (a >= 1e4) return `${fmtNum(v / 1e3, digits)} тыс.`
  return fmtNum(v, 0)
}

/** Длительность как в кабинете: 43 м · 11 ч 11 м · 1 д 1 ч */
export function fmtDuration(sec: number): string {
  const m = Math.max(0, Math.round(sec / 60))
  if (m < 60) return `${m} м`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч ${m % 60} м`
  return `${Math.floor(h / 24)} д ${h % 24} ч`
}

/** Склонение: plural(5, 'сделка', 'сделки', 'сделок') → «сделок» */
export function plural(n: number, one: string, few: string, many: string): string {
  const r = Math.abs(n) % 10
  const l = Math.abs(n) % 100
  if (r === 1 && l !== 11) return one
  if (r >= 2 && r <= 4 && (l < 12 || l > 14)) return few
  return many
}

export const toneOf = (v: number | null | undefined) => (v == null || v === 0 ? '' : v > 0 ? 'up' : 'down')
