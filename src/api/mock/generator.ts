/**
 * Генератор демо-данных. Полностью детерминированный: одни и те же ключи дают одни и те же цифры,
 * поэтому страницы стабильны между перезагрузками. Реальный бэкенд эту логику не повторяет —
 * он отдает посчитанные агрегаты в формате из ../types.ts.
 */
import type {
  CloseReason,
  CoinDetail,
  CoinDirectionStat,
  CoinMonth,
  CoinStat,
  DayStat,
  Direction,
  EquityPoint,
  ExchangeStat,
  ExitModeStat,
  MatrixRow,
  MonthReport,
  MonthSummary,
  MonthlyMatrix,
  PeriodKey,
  Records,
  SegmentKey,
  SegmentMonthSeries,
  SegmentStat,
  SpotComparison,
  StageKey,
  StageStat,
  StrategyDetail,
  StrategyKey,
  Summary,
  TierKey,
  TopCoin,
  WeightBucket,
} from '../types'
import { AUTO_UNIVERSE, PORTFOLIO, coinName } from '../../content/coins'
import { EXIT_ORDER, SEGMENT_ORDER, STAGES, STAGE_ORDER } from '../../content/dictionary'
import { addDays, addMonthsYM, daysInMonth, parseISODate, toISODate, toYM, ymParts } from '../../lib/dates'
import { clamp, gauss, rand, round } from '../../lib/rng'

/* ───────────────────────── календарь данных ───────────────────────── */

export const DATA_START = '2025-01-01'

/** Данные считаются раз в сутки в 03:00 — последним полным днем считается вчера. */
function computeLastDay(): Date {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return addDays(d, -1)
}

export const LAST_DAY = computeLastDay()
export const LAST_ISO = toISODate(LAST_DAY)
export const CURRENT_YM = toYM(LAST_DAY)
export const UPDATED_AT = (() => {
  const d = addDays(LAST_DAY, 1)
  d.setHours(3, 0, 0, 0)
  return d.toISOString()
})()

const START_DATE = parseISODate(DATA_START)

export function monthList(): string[] {
  const out: string[] = []
  let ym = DATA_START.slice(0, 7)
  while (ym <= CURRENT_YM) {
    out.push(ym)
    ym = addMonthsYM(ym, 1)
  }
  return out
}

function daysOfMonth(ym: string): string[] {
  const { year, month0 } = ymParts(ym)
  const n = daysInMonth(year, month0)
  const out: string[] = []
  for (let i = 1; i <= n; i++) out.push(`${ym}-${String(i).padStart(2, '0')}`)
  return out
}

/* ───────────────────────── рыночный режим ───────────────────────── */

/** Тренд рынка по месяцам: > 0 — рост, < 0 — снижение. Сюжет близок к таблице доходности: 2026 начинается с падения. */
const REGIME: Record<string, number> = {
  '2025-01': 0.6, '2025-02': -0.4, '2025-03': -0.8, '2025-04': 0.3, '2025-05': 0.9, '2025-06': 0.2,
  '2025-07': 1.0, '2025-08': 0.4, '2025-09': -0.2, '2025-10': 0.8, '2025-11': -1.3, '2025-12': -0.6,
  '2026-01': -0.5, '2026-02': -1.1, '2026-03': -0.3, '2026-04': 0.4, '2026-05': -0.7, '2026-06': -0.4,
  '2026-07': 0.6, '2026-08': 0.3, '2026-09': 0.7,
}
const regime = (ym: string) => REGIME[ym] ?? clamp(gauss(`regime:${ym}`) * 0.7, -1.4, 1.4)

const volOf = (sym: string) => PORTFOLIO.find((c) => c.symbol === sym)?.vol ?? 1.35
const rankOf = (sym: string) => PORTFOLIO.findIndex((c) => c.symbol === sym) + 1
const tierOf = (rank: number): TierKey => (rank <= 10 ? 10 : rank <= 20 ? 20 : 30)

/* ───────────────────────── месяцы монет ───────────────────────── */

const memo = new Map<string, number>()
function cached(key: string, fn: () => number) {
  const v = memo.get(key)
  if (v !== undefined) return v
  const r = fn()
  memo.set(key, r)
  return r
}

/** Изменение цены на споте за месяц, %. */
export function spotMonth(sym: string, ym: string): number {
  return cached(`spot:${sym}:${ym}`, () => {
    const t = regime(ym)
    if (sym === 'BTC') return round(t * 8.5 + gauss(`spot:BTC:${ym}`) * 2.5, 2)
    const vol = volOf(sym)
    const beta = 0.8 + 0.5 * vol
    return round(clamp(t * 8.5 * beta + gauss(`spot:${sym}:${ym}`) * 5 * vol, -55, 90), 2)
  })
}

/** Полный результат DCA · Manual за месяц по монете и направлению, % к выделенной сумме (до обрезки текущим днем). */
function coinMonthModel(sym: string, dir: Direction, ym: string): number {
  return cached(`cm:${sym}:${dir}:${ym}`, () => {
    const t = regime(ym)
    const vol = volOf(sym)
    const k = `${sym}:${dir}:${ym}`
    let v: number
    if (dir === 'LONG') {
      v = 1.9 + 3.5 * vol + (t > 0 ? t * 1.6 * vol : 0) + Math.abs(t) * 0.8 * vol - (t < -0.8 ? Math.abs(t) * 2.8 * vol : 0)
      v += gauss(`n:${k}`) * 1.9 * vol + gauss(`shock:LONG:${ym}`) * 1.6
      if (t < -0.85 && rand(`loss:${k}`) < 0.1 * vol) v = -(3 + rand(`lm:${k}`) * 9) * vol
    } else {
      v = 2.3 + 3.9 * vol + (t < 0 ? Math.abs(t) * 1.7 * vol : 0) + Math.abs(t) * 0.6 * vol - (t > 0.8 ? t * 3 * vol : 0)
      v += gauss(`n:${k}`) * 2.1 * vol + gauss(`shock:SHORT:${ym}`) * 1.8
      if (t > 0.85 && rand(`loss:${k}`) < 0.1 * vol) v = -(3 + rand(`lm:${k}`) * 9) * vol
    }
    return round(clamp(v, -28, 48), 2)
  })
}

/** Сделок за месяц по монете и направлению (все боты платформы). */
function coinMonthTrades(sym: string, dir: Direction, ym: string): number {
  return cached(`ct:${sym}:${dir}:${ym}`, () => {
    const vol = volOf(sym)
    const rank = rankOf(sym) || 25
    const perBot = (6 + 18 * vol) * (0.7 + 0.6 * rand(`tpb:${sym}:${dir}:${ym}`))
    const growth = platformGrowth(ym)
    const bots = (dir === 'LONG' ? 150 : 80) / (1 + rank * 0.085) * growth * (0.85 + 0.3 * rand(`bots:${sym}:${dir}:${ym}`))
    return Math.max(4, Math.round(perBot * Math.max(1, bots)))
  })
}

/** Рост платформы: число ботов и выделенных сумм со временем. */
function platformGrowth(ym: string): number {
  const all = monthList()
  const i = Math.max(0, all.indexOf(ym))
  return 0.32 + 0.68 * (i / Math.max(1, all.length - 1))
}

/** Доля месяца, которая уже прошла (для текущего месяца), 0–1. */
function monthElapsed(ym: string): number {
  if (ym < CURRENT_YM) return 1
  if (ym > CURRENT_YM) return 0
  const { year, month0 } = ymParts(ym)
  return LAST_DAY.getDate() / daysInMonth(year, month0)
}

/** Фактический результат монеты за месяц с учетом текущей даты. */
export function coinMonth(sym: string, dir: Direction, ym: string): number | null {
  const e = monthElapsed(ym)
  if (e === 0 || ym < DATA_START.slice(0, 7)) return null
  return round(coinMonthModel(sym, dir, ym) * e, 2)
}

/* ───────────────────────── стадии DCA · Auto ───────────────────────── */

const STAGE_BASE: Record<StageKey, number> = { PUMP: 16, RIDE: 13, RUN: 14.5, CRASH: 18, FLIP: 11.5, DUMP: 14, EARLY: 20 }

function stageMonthModel(stage: StageKey, ym: string): number {
  return cached(`sm:${stage}:${ym}`, () => {
    const t = regime(ym)
    const long = STAGES[stage].direction === 'LONG'
    let v = STAGE_BASE[stage] * (0.72 + 0.56 * rand(`sb:${stage}:${ym}`))
    v += (long ? t : -t) * 4.5
    if ((stage === 'CRASH' || stage === 'EARLY') && rand(`sl:${stage}:${ym}`) < 0.11) v = -(6 + rand(`slm:${stage}:${ym}`) * 16)
    if (ym === '2025-11' && long) v = -(4 + rand(`nov:${stage}`) * 10)
    return round(clamp(v, -30, 60), 2)
  })
}

/** Доля сделок стадии в месяце, 0–1 (сумма по стадиям = 1). */
function stageShares(ym: string): Record<StageKey, number> {
  const t = regime(ym)
  const raw: Record<StageKey, number> = {
    PUMP: 0.2 + Math.max(0, t) * 0.12,
    RIDE: 0.09 + Math.max(0, t) * 0.05,
    RUN: 0.11 + Math.max(0, t) * 0.08,
    CRASH: 0.07 + Math.max(0, -t) * 0.04,
    FLIP: 0.21 + Math.max(0, t) * 0.03,
    DUMP: 0.14 + Math.max(0, -t) * 0.1,
    EARLY: 0.18 + Math.max(0, -t) * 0.06,
  }
  for (const s of STAGE_ORDER) raw[s] *= 0.85 + 0.3 * rand(`ss:${s}:${ym}`)
  const sum = STAGE_ORDER.reduce((a, s) => a + raw[s], 0)
  for (const s of STAGE_ORDER) raw[s] /= sum
  return raw
}

function autoMonthModel(ym: string): number {
  return cached(`auto:${ym}`, () => {
    const sh = stageShares(ym)
    const shock = ym === '2025-11' ? -9 : ym === '2026-02' ? -4 : gauss(`autoShock:${ym}`) * 3.2
    return round(STAGE_ORDER.reduce((a, s) => a + sh[s] * stageMonthModel(s, ym), 0) + shock, 2)
  })
}

function autoMonthTrades(ym: string): number {
  return cached(`autoT:${ym}`, () => Math.round(9800 * platformGrowth(ym) * (0.85 + 0.3 * rand(`at:${ym}`))))
}

/* ───────────────────────── сегменты ───────────────────────── */

/** Веса сегментов в индексе DSTrade — доли выделенных ботам сумм. */
export const SEGMENT_WEIGHT: Record<SegmentKey, number> = { manual_long: 0.46, manual_short: 0.24, auto: 0.3 }

/** Выделено ботам сегмента, USDT (растет вместе с платформой). */
const SEGMENT_ALLOC: Record<SegmentKey, number> = { manual_long: 1_180_000, manual_short: 560_000, auto: 690_000 }

function segmentMonthModel(seg: SegmentKey, ym: string): number {
  return cached(`seg:${seg}:${ym}`, () => {
    if (seg === 'auto') return autoMonthModel(ym)
    const dir: Direction = seg === 'manual_long' ? 'LONG' : 'SHORT'
    let num = 0
    let den = 0
    for (const c of PORTFOLIO) {
      const w = coinMonthTrades(c.symbol, dir, ym)
      num += coinMonthModel(c.symbol, dir, ym) * w
      den += w
    }
    return round(num / den, 2)
  })
}

function segmentMonthTrades(seg: SegmentKey, ym: string): number {
  if (seg === 'auto') return autoMonthTrades(ym)
  const dir: Direction = seg === 'manual_long' ? 'LONG' : 'SHORT'
  return PORTFOLIO.reduce((a, c) => a + coinMonthTrades(c.symbol, dir, ym), 0)
}

const dayCache = new Map<string, { pct: number; trades: number }[]>()

/** Дневные результаты сегмента за месяц (полный месяц; обрезка текущей датой — в вызывающем коде). */
function segmentDays(seg: SegmentKey, ym: string): { pct: number; trades: number }[] {
  const key = `${seg}:${ym}`
  const hit = dayCache.get(key)
  if (hit) return hit
  const days = daysOfMonth(ym)
  const total = segmentMonthModel(seg, ym)
  const trades = segmentMonthTrades(seg, ym)
  const n = days.length
  const noise = seg === 'auto' ? 0.62 : 0.14
  const raw = days.map((d) => total / n + gauss(`day:${seg}:${d}`) * ((Math.abs(total) / n) * 0.85 + noise))
  const shift = (total - raw.reduce((a, b) => a + b, 0)) / n
  const tw = days.map((d) => 0.6 + rand(`dt:${seg}:${d}`) * 0.8)
  const tws = tw.reduce((a, b) => a + b, 0)
  const out = raw.map((v, i) => ({ pct: v + shift, trades: Math.round((trades * tw[i]) / tws) }))
  dayCache.set(key, out)
  return out
}

/** Дни сегмента в диапазоне [from, to]. */
function segmentDayRange(seg: SegmentKey, from: string, to: string): DayStat[] {
  const out: DayStat[] = []
  let ym = from.slice(0, 7)
  const endYM = to.slice(0, 7)
  while (ym <= endYM) {
    const days = daysOfMonth(ym)
    const vals = segmentDays(seg, ym)
    days.forEach((d, i) => {
      if (d >= from && d <= to && d <= LAST_ISO && d >= DATA_START) out.push({ d, pct: vals[i].pct, trades: vals[i].trades })
    })
    ym = addMonthsYM(ym, 1)
  }
  return out
}

/** Дни индекса DSTrade (взвешенная сумма сегментов). */
function indexDayRange(from: string, to: string, segs: SegmentKey[] = SEGMENT_ORDER): DayStat[] {
  const parts = segs.map((s) => segmentDayRange(s, from, to))
  const wsum = segs.reduce((a, s) => a + SEGMENT_WEIGHT[s], 0)
  return parts[0].map((p, i) => ({
    d: p.d,
    pct: segs.reduce((a, s, j) => a + (parts[j][i].pct * SEGMENT_WEIGHT[s]) / wsum, 0),
    trades: segs.reduce((a, _s, j) => a + parts[j][i].trades, 0),
  }))
}

/** BTC на споте по дням (сложный процент внутри месяца). */
function btcDayRange(from: string, to: string): { d: string; pct: number }[] {
  const out: { d: string; pct: number }[] = []
  let ym = from.slice(0, 7)
  while (ym <= to.slice(0, 7)) {
    const days = daysOfMonth(ym)
    const m = spotMonth('BTC', ym) / 100
    const n = days.length
    const base = Math.pow(1 + m, 1 / n) - 1
    const raw = days.map((d) => base + gauss(`btcd:${d}`) * 0.018)
    const target = Math.log(1 + m)
    const logSum = raw.reduce((a, r) => a + Math.log(1 + r), 0)
    const adj = (target - logSum) / n
    days.forEach((d, i) => {
      const r = Math.exp(Math.log(1 + raw[i]) + adj) - 1
      if (d >= from && d <= to && d <= LAST_ISO && d >= DATA_START) out.push({ d, pct: r * 100 })
    })
    ym = addMonthsYM(ym, 1)
  }
  return out
}

/* ───────────────────────── периоды ───────────────────────── */

export function periodRange(p: PeriodKey): { from: string; to: string } {
  const to = LAST_ISO
  const days = p === '7d' ? 7 : p === '30d' ? 30 : p === '90d' ? 90 : p === '365d' ? 365 : 0
  const from = days ? toISODate(addDays(LAST_DAY, -(days - 1))) : DATA_START
  return { from: from < DATA_START ? DATA_START : from, to }
}

/** Доля месяца ym, попадающая в [from, to]. */
function monthOverlap(ym: string, from: string, to: string): number {
  const days = daysOfMonth(ym)
  const inRange = days.filter((d) => d >= from && d <= to && d <= LAST_ISO).length
  return inRange / days.length
}

function monthsInRange(from: string, to: string): string[] {
  return monthList().filter((ym) => monthOverlap(ym, from, to) > 0)
}

/** Результат монеты за произвольный период — сумма пересечений месяцев. */
function coinRangeReturn(sym: string, dir: Direction, from: string, to: string) {
  let pct = 0
  let trades = 0
  let spot = 1
  for (const ym of monthsInRange(from, to)) {
    const f = monthOverlap(ym, from, to)
    pct += coinMonthModel(sym, dir, ym) * f
    trades += coinMonthTrades(sym, dir, ym) * f
    spot *= 1 + (spotMonth(sym, ym) / 100) * f
  }
  return { pct: round(pct, 2), trades: Math.round(trades), spot: round((spot - 1) * 100, 2) }
}

/* ───────────────────────── метрики сегментов ───────────────────────── */

const SEG_PROFILE: Record<SegmentKey, { wr: number; avgTrade: number; avgLoss: number; dur: number; dd: number; liq: number; risk: SegmentStat['risk']; bots: number }> = {
  manual_long: { wr: 98.7, avgTrade: 0.92, avgLoss: -19.5, dur: 13.4 * 3600, dd: -17.8, liq: 0.21, risk: 'moderate', bots: 1680 },
  manual_short: { wr: 98.1, avgTrade: 1.04, avgLoss: -22.4, dur: 11.9 * 3600, dd: -21.2, liq: 0.34, risk: 'elevated', bots: 760 },
  auto: { wr: 96.2, avgTrade: 2.28, avgLoss: -31.6, dur: 8.6 * 3600, dd: -34.5, liq: 1.12, risk: 'very_high', bots: 1210 },
}

function segmentStat(seg: SegmentKey, from: string, to: string, key: string): SegmentStat {
  const days = segmentDayRange(seg, from, to)
  const ret = days.reduce((a, d) => a + d.pct, 0)
  const trades = days.reduce((a, d) => a + d.trades, 0)
  const pr = SEG_PROFILE[seg]
  const months = monthsInRange(from, to)
  const fullMonths = Math.max(1, days.length / 30.4)
  const spark = monthList().slice(-12).map((ym) => round(segmentMonthModel(seg, ym) * monthElapsed(ym), 2))
  const growth = platformGrowth(to.slice(0, 7))
  return {
    key: seg,
    strategy: seg === 'auto' ? 'auto' : 'manual',
    direction: seg === 'manual_long' ? 'LONG' : seg === 'manual_short' ? 'SHORT' : null,
    returnPct: round(ret, 2),
    avgMonthPct: round(ret / fullMonths, 2),
    trades,
    winRate: round(clamp(pr.wr + gauss(`wr:${seg}:${key}`) * 0.35, 90, 99.9), 1),
    avgTradePct: round(pr.avgTrade * (0.9 + 0.2 * rand(`at:${seg}:${key}`)), 2),
    avgDurationSec: Math.round(pr.dur * (0.88 + 0.24 * rand(`du:${seg}:${key}`))),
    drawdownP90Pct: round(pr.dd * (0.9 + 0.2 * rand(`dd:${seg}:${key}`)) * (months.length > 3 ? 1.08 : 1), 1),
    liqShare: round(pr.liq * (0.8 + 0.4 * rand(`lq:${seg}:${key}`)), 2),
    bots: Math.round(pr.bots * growth),
    risk: pr.risk,
    spark,
  }
}

function closeReasonsFor(key: string, liqBase = 0.4): Record<CloseReason, number> {
  const liq = round(liqBase * (0.7 + 0.6 * rand(`cr:liq:${key}`)), 2)
  const stop = round(1.1 + rand(`cr:stop:${key}`) * 0.9, 2)
  const basket = round(15.5 + rand(`cr:b:${key}`) * 5, 2)
  return { take: round(100 - liq - stop - basket, 2), basket, stop, liq }
}

/* ───────────────────────── публичные функции ───────────────────────── */

export function getSummary(period: PeriodKey): Summary {
  const { from, to } = periodRange(period)
  const idx = indexDayRange(from, to)
  const btc = btcDayRange(from, to)
  const ret = idx.reduce((a, d) => a + d.pct, 0)
  const trades = idx.reduce((a, d) => a + d.trades, 0)
  let profitUsd = 0
  for (const seg of SEGMENT_ORDER) {
    for (const d of segmentDayRange(seg, from, to)) profitUsd += (d.pct / 100) * SEGMENT_ALLOC[seg] * platformGrowth(d.d.slice(0, 7))
  }
  const segStats = SEGMENT_ORDER.map((s) => segmentStat(s, from, to, period))
  const wr = segStats.reduce((a, s) => a + s.winRate * s.trades, 0) / Math.max(1, trades)
  const wins = Math.round((trades * wr) / 100)
  const avgTrade = segStats.reduce((a, s) => a + s.avgTradePct * s.trades, 0) / Math.max(1, trades)
  const avgLoss = -(21.5 + rand(`al:${period}`) * 6)
  const avgWin = (avgTrade - (1 - wr / 100) * avgLoss) / (wr / 100)
  const dur = segStats.reduce((a, s) => a + s.avgDurationSec * s.trades, 0) / Math.max(1, trades)
  const btcCum = btc.reduce((a, d) => a * (1 + d.pct / 100), 1) - 1
  const growth = platformGrowth(to.slice(0, 7))
  return {
    period,
    from,
    to,
    updatedAt: UPDATED_AT,
    returnPct: round(ret, 2),
    profitUsd: round(profitUsd, 2),
    benchmarkPct: round(btcCum * 100, 2),
    trades,
    tradesPerDay: round(trades / Math.max(1, idx.length), 1),
    wins,
    losses: trades - wins,
    winRate: round(wr, 1),
    avgTradePct: round(avgTrade, 2),
    avgWinPct: round(avgWin, 2),
    avgLossPct: round(avgLoss, 2),
    avgDurationSec: Math.round(dur),
    avgDurationWinSec: Math.round(dur * 0.98),
    avgDurationLossSec: Math.round(dur * 2.35),
    activeBots: Math.round(3650 * growth * (period === '7d' ? 0.86 : 1)),
    accounts: Math.round(1240 * growth * (period === '7d' ? 0.9 : 1)),
    volumeUsd: Math.round(trades * 1480 * (0.9 + 0.2 * rand(`vol:${period}`))),
    feesPct: round(-Math.abs(ret) * 0.064 - 0.05, 2),
    fundingPct: round(ret * 0.018 + gauss(`fund:${period}`) * 0.08, 2),
    closeReasons: closeReasonsFor(`sum:${period}`),
  }
}

export function getEquity(period: PeriodKey, segs: SegmentKey[] = SEGMENT_ORDER): EquityPoint[] {
  const { from, to } = periodRange(period)
  const idx = indexDayRange(from, to, segs)
  const btc = btcDayRange(from, to)
  let v = 0
  let b = 1
  return idx.map((p, i) => {
    v += p.pct
    b *= 1 + (btc[i]?.pct ?? 0) / 100
    return { t: p.d, v: round(v, 3), b: round((b - 1) * 100, 3), d: round(p.pct, 3) }
  })
}

export function getSegments(period: PeriodKey): SegmentStat[] {
  const { from, to } = periodRange(period)
  return SEGMENT_ORDER.map((s) => segmentStat(s, from, to, period))
}

export function getMonthlyMatrix(year: number, by: 'segments' | 'coins' | 'stages', direction: Direction = 'LONG', limit = 15): MonthlyMatrix {
  const yms = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
  const valid = (ym: string) => ym >= DATA_START.slice(0, 7) && ym <= CURRENT_YM
  const mkRow = (key: string, label: string, fn: (ym: string) => number | null, extra: Partial<MatrixRow> = {}): MatrixRow => {
    const values = yms.map((ym) => (valid(ym) ? fn(ym) : null))
    const nums = values.filter((v): v is number => v != null)
    const total = round(nums.reduce((a, b) => a + b, 0), 2)
    const fullCount = yms.filter((ym, i) => values[i] != null && ym < CURRENT_YM).length
    const fullSum = yms.reduce((a, ym, i) => (values[i] != null && ym < CURRENT_YM ? a + (values[i] as number) : a), 0)
    return { key, label, values: values.map((v) => (v == null ? null : round(v, 2))), total, avg: round(fullCount ? fullSum / fullCount : total, 2), ...extra }
  }
  let rows: MatrixRow[]
  let footerLabel = 'Итого к портфелю, %'
  if (by === 'segments') {
    rows = SEGMENT_ORDER.map((s) =>
      mkRow(s, s === 'auto' ? 'DCA · Auto' : `DCA · Manual ${s === 'manual_long' ? 'LONG' : 'SHORT'}`, (ym) => segmentMonthModel(s, ym) * monthElapsed(ym)),
    )
    footerLabel = 'Индекс DSTrade, %'
    const footer = mkRow('index', footerLabel, (ym) => SEGMENT_ORDER.reduce((a, s) => a + segmentMonthModel(s, ym) * monthElapsed(ym) * SEGMENT_WEIGHT[s], 0))
    return { year, rows, footer }
  }
  if (by === 'stages') {
    rows = STAGE_ORDER.map((s) => mkRow(s, s, (ym) => stageMonthModel(s, ym) * monthElapsed(ym), { stage: s }))
    footerLabel = 'Итого DCA · Auto, %'
    const footer = mkRow('auto', footerLabel, (ym) => autoMonthModel(ym) * monthElapsed(ym))
    return { year, rows, footer }
  }
  const coins = PORTFOLIO.slice(0, limit)
    .map((c) => c.symbol)
    .sort()
  rows = coins.map((sym) => mkRow(sym, sym, (ym) => coinMonth(sym, direction, ym), { symbol: sym }))
  const footer = mkRow('portfolio', footerLabel, (ym) => {
    const vals = coins.map((s) => coinMonth(s, direction, ym)).filter((v): v is number => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  })
  return { year, rows, footer }
}

function coinDrawdown(sym: string, dir: Direction, key: string) {
  return round(-(7.5 + 11 * volOf(sym) + rand(`cdd:${sym}:${dir}:${key}`) * 4) * (dir === 'SHORT' ? 1.1 : 1), 1)
}

function coinStatFor(sym: string, dir: Direction, from: string, to: string, key: string): CoinStat {
  const r = coinRangeReturn(sym, dir, from, to)
  const rank = rankOf(sym)
  const vol = volOf(sym)
  return {
    symbol: sym,
    name: coinName(sym),
    rank,
    tier: tierOf(rank),
    exchanges: PORTFOLIO[rank - 1].exchanges,
    trades: r.trades,
    returnPct: r.pct,
    winRate: round(clamp(99.6 - vol * 1.3 + gauss(`cwr:${sym}:${dir}:${key}`) * 0.4, 94, 100), 1),
    avgDurationSec: Math.round((20 - vol * 7 + rand(`cdu:${sym}:${dir}:${key}`) * 5) * 3600),
    drawdownP90Pct: coinDrawdown(sym, dir, key),
    spotPct: r.spot,
    spark: monthList().slice(-12).map((ym) => coinMonth(sym, dir, ym) ?? 0),
  }
}

/** Монеты портфеля за период или за месяц (ym). */
export function getCoins(opts: { period?: PeriodKey; ym?: string; tier: TierKey; direction: Direction }): CoinStat[] {
  let from: string
  let to: string
  let key: string
  if (opts.ym) {
    from = `${opts.ym}-01`
    const { year, month0 } = ymParts(opts.ym)
    to = `${opts.ym}-${String(daysInMonth(year, month0)).padStart(2, '0')}`
    key = opts.ym
  } else {
    ;({ from, to } = periodRange(opts.period ?? '30d'))
    key = opts.period ?? '30d'
  }
  return PORTFOLIO.slice(0, opts.tier).map((c) => coinStatFor(c.symbol, opts.direction, from, to, key))
}

/** Топ-3 монеты месяца среди всех, где работали боты (включая DCA · Auto вне портфеля). */
export function getTop3(ym: string): TopCoin[] {
  const e = monthElapsed(ym)
  const cands: TopCoin[] = []
  for (const c of PORTFOLIO) {
    for (const dir of ['LONG', 'SHORT'] as Direction[]) {
      const v = coinMonth(c.symbol, dir, ym)
      if (v != null) cands.push({ symbol: c.symbol, name: coinName(c.symbol), trades: Math.round(coinMonthTrades(c.symbol, dir, ym) * e), returnPct: v, strategy: 'manual', direction: dir })
    }
  }
  for (const sym of AUTO_UNIVERSE) {
    if (rand(`au:${sym}:${ym}`) < 0.55) continue
    const stage = STAGE_ORDER[Math.floor(rand(`aus:${sym}:${ym}`) * STAGE_ORDER.length)]
    const v = round((22 + rand(`auv:${sym}:${ym}`) * 22) * e, 2)
    cands.push({ symbol: sym, name: coinName(sym), trades: Math.round((180 + rand(`aut:${sym}:${ym}`) * 420) * e), returnPct: v, strategy: 'auto', direction: STAGES[stage].direction, stage })
  }
  const seen = new Set<string>()
  return cands
    .sort((a, b) => b.returnPct - a.returnPct)
    .filter((c) => (seen.has(c.symbol) ? false : (seen.add(c.symbol), true)))
    .slice(0, 3)
}

function dirStat(sym: string, dir: Direction, months: CoinMonth[]): CoinDirectionStat {
  const vals = months.map((m) => ({ ym: m.ym, pct: dir === 'LONG' ? m.long : m.short })).filter((m): m is { ym: string; pct: number } => m.pct != null)
  const last12 = vals.slice(-12)
  const full = last12.filter((m) => m.ym < CURRENT_YM)
  const sorted = [...full].sort((a, b) => b.pct - a.pct)
  return {
    returnPct12m: round(last12.reduce((a, m) => a + m.pct, 0), 2),
    avgMonthPct: round(full.reduce((a, m) => a + m.pct, 0) / Math.max(1, full.length), 2),
    trades12m: months.slice(-12).reduce((a, m) => a + (dir === 'LONG' ? m.tradesLong : m.tradesShort), 0),
    winRate: round(clamp(99.6 - volOf(sym) * 1.3 + gauss(`dwr:${sym}:${dir}`) * 0.3, 94, 100), 1),
    avgDurationSec: Math.round((20 - volOf(sym) * 7 + rand(`ddu:${sym}:${dir}`) * 5) * 3600),
    drawdownP90Pct: coinDrawdown(sym, dir, '12m'),
    bestMonth: sorted[0] ?? { ym: CURRENT_YM, pct: 0 },
    worstMonth: sorted[sorted.length - 1] ?? { ym: CURRENT_YM, pct: 0 },
  }
}

export function getCoinDetail(symbol: string): CoinDetail | null {
  const rank = rankOf(symbol)
  if (!rank) return null
  const months: CoinMonth[] = monthList().map((ym) => ({
    ym,
    long: coinMonth(symbol, 'LONG', ym),
    short: coinMonth(symbol, 'SHORT', ym),
    tradesLong: Math.round(coinMonthTrades(symbol, 'LONG', ym) * monthElapsed(ym)),
    tradesShort: Math.round(coinMonthTrades(symbol, 'SHORT', ym) * monthElapsed(ym)),
    spot: round(spotMonth(symbol, ym) * monthElapsed(ym), 2),
  }))
  return {
    symbol,
    name: coinName(symbol),
    rank,
    tier: tierOf(rank),
    exchanges: PORTFOLIO[rank - 1].exchanges,
    months,
    long: dirStat(symbol, 'LONG', months),
    short: dirStat(symbol, 'SHORT', months),
  }
}

const STAGE_PROFILE: Record<StageKey, { wr: number; avg: number; deep: number; mae: number; dur: number }> = {
  PUMP: { wr: 96.8, avg: 2.1, deep: 7.5, mae: 9, dur: 7.2 },
  RIDE: { wr: 97.4, avg: 1.8, deep: 5.2, mae: 7, dur: 5.1 },
  RUN: { wr: 96.9, avg: 2.0, deep: 6.8, mae: 8, dur: 6.4 },
  CRASH: { wr: 94.1, avg: 2.9, deep: 14.5, mae: 17, dur: 11.8 },
  FLIP: { wr: 97.9, avg: 1.7, deep: 4.3, mae: 6, dur: 9.3 },
  DUMP: { wr: 97.1, avg: 2.0, deep: 6.1, mae: 8, dur: 6.9 },
  EARLY: { wr: 95.2, avg: 2.7, deep: 11.8, mae: 13, dur: 8.2 },
}

export function getStages(period: PeriodKey): StageStat[] {
  const { from, to } = periodRange(period)
  const months = monthsInRange(from, to)
  const res = STAGE_ORDER.map((s) => {
    let ret = 0
    let trades = 0
    for (const ym of months) {
      const f = monthOverlap(ym, from, to)
      ret += stageMonthModel(s, ym) * f
      trades += autoMonthTrades(ym) * stageShares(ym)[s] * f
    }
    const p = STAGE_PROFILE[s]
    const k = `${s}:${period}`
    return {
      key: s,
      direction: STAGES[s].direction,
      trades: Math.round(trades),
      share: 0,
      returnPct: round(ret, 2),
      avgTradePct: round(p.avg * (0.9 + 0.2 * rand(`sa:${k}`)), 2),
      winRate: round(clamp(p.wr + gauss(`sw:${k}`) * 0.4, 88, 99.9), 1),
      deepShare: round(p.deep * (0.8 + 0.4 * rand(`sd:${k}`)), 1),
      maeMedPct: round(p.mae * (0.85 + 0.3 * rand(`sm1:${k}`)), 1),
      maeP90Pct: round(p.mae * (2.4 + 0.8 * rand(`sm2:${k}`)), 1),
      durMedSec: Math.round(p.dur * 3600 * (0.85 + 0.3 * rand(`sdu:${k}`))),
      spark: monthList().slice(-12).map((ym) => round(stageMonthModel(s, ym) * monthElapsed(ym), 2)),
    }
  })
  const tot = res.reduce((a, r) => a + r.trades, 0)
  return res.map((r) => ({ ...r, share: round((r.trades / Math.max(1, tot)) * 100, 1) }))
}

const EXIT_PROFILE = {
  conservative: { share: 22, k: 0.78, dur: 0.68, wr: 99.1, w: 1.6 },
  normal: { share: 51, k: 1, dur: 1, wr: 98.6, w: 2.0 },
  aggressive: { share: 19, k: 1.27, dur: 1.46, wr: 97.9, w: 2.4 },
  overkill: { share: 8, k: 1.52, dur: 1.94, wr: 97.1, w: 2.8 },
}

function exitModes(base: SegmentStat, key: string): ExitModeStat[] {
  return EXIT_ORDER.map((m) => {
    const p = EXIT_PROFILE[m]
    const share = round(p.share * (0.9 + 0.2 * rand(`em:${m}:${key}`)), 1)
    const avg = round(base.avgTradePct * p.k * (0.95 + 0.1 * rand(`ea:${m}:${key}`)), 2)
    return {
      key: m,
      trades: Math.round((base.trades * share) / 100),
      share,
      avgTradePct: avg,
      winRate: round(clamp(p.wr - (base.strategy === 'auto' ? 2.2 : 0) + gauss(`ew:${m}:${key}`) * 0.2, 90, 99.9), 1),
      avgDurationSec: Math.round(base.avgDurationSec * p.dur),
      avgMaxWeight: round(p.w * (base.strategy === 'auto' ? 1.18 : 1), 1),
      returnPct: round(base.avgMonthPct * p.k, 2),
    }
  })
}

function weightBuckets(strategy: StrategyKey): WeightBucket[] {
  const dist = strategy === 'manual' ? [37, 22, 14, 9.5, 6.5, 4.5, 3, 2, 1.5] : [29, 20, 15, 11, 8.5, 6.5, 4.5, 3, 2.5]
  return dist.map((share, w) => ({ weight: w, share, avgTradePct: round((strategy === 'manual' ? 0.45 : 0.9) + w * (strategy === 'manual' ? 0.34 : 0.62), 2) }))
}

function exchangeStats(total: number, key: string, baseRet: number): ExchangeStat[] {
  const shares = { bybit: 52, binance: 24, bitget: 16, okx: 8 }
  return (Object.keys(shares) as (keyof typeof shares)[]).map((k) => ({
    key: k,
    share: shares[k],
    trades: Math.round((total * shares[k]) / 100),
    returnPct: round(baseRet * (0.93 + 0.14 * rand(`ex:${k}:${key}`)), 2),
  }))
}

export function getStrategy(strategy: StrategyKey, direction: Direction | 'ALL', period: PeriodKey): StrategyDetail {
  const { from, to } = periodRange(period)
  const segs: SegmentKey[] = strategy === 'auto' ? ['auto'] : direction === 'LONG' ? ['manual_long'] : direction === 'SHORT' ? ['manual_short'] : ['manual_long', 'manual_short']
  const stats = segs.map((s) => segmentStat(s, from, to, period))
  let segment: SegmentStat
  if (stats.length === 1) segment = stats[0]
  else {
    const t = stats.reduce((a, s) => a + s.trades, 0)
    const w = (f: (s: SegmentStat) => number) => stats.reduce((a, s) => a + f(s) * s.trades, 0) / t
    const wsum = segs.reduce((a, s) => a + SEGMENT_WEIGHT[s], 0)
    const wv = (f: (s: SegmentStat) => number) => stats.reduce((a, s, i) => a + (f(s) * SEGMENT_WEIGHT[segs[i]]) / wsum, 0)
    segment = {
      ...stats[0],
      direction: null,
      returnPct: round(wv((s) => s.returnPct), 2),
      avgMonthPct: round(wv((s) => s.avgMonthPct), 2),
      trades: t,
      winRate: round(w((s) => s.winRate), 1),
      avgTradePct: round(w((s) => s.avgTradePct), 2),
      avgDurationSec: Math.round(w((s) => s.avgDurationSec)),
      drawdownP90Pct: round(Math.min(...stats.map((s) => s.drawdownP90Pct)), 1),
      liqShare: round(w((s) => s.liqShare), 2),
      bots: stats.reduce((a, s) => a + s.bots, 0),
      spark: stats[0].spark.map((_, i) => round(wv((s) => s.spark[i]), 2)),
    }
  }
  const key = `${strategy}:${direction}:${period}`
  let coins: StrategyDetail['coins'] = []
  if (strategy === 'manual') {
    const dirs: Direction[] = direction === 'ALL' ? ['LONG', 'SHORT'] : [direction]
    coins = PORTFOLIO.map((c) => {
      const rs = dirs.map((d) => coinRangeReturn(c.symbol, d, from, to))
      return { symbol: c.symbol, name: coinName(c.symbol), returnPct: round(rs.reduce((a, r) => a + r.pct, 0) / rs.length, 2), trades: rs.reduce((a, r) => a + r.trades, 0) }
    }).sort((a, b) => b.returnPct - a.returnPct)
  }
  return {
    strategy,
    direction,
    period,
    segment,
    equity: getEquity(period, segs),
    exitModes: exitModes(segment, key),
    weights: weightBuckets(strategy),
    closeReasons: closeReasonsFor(key, segment.liqShare),
    exchanges: exchangeStats(segment.trades, key, segment.returnPct),
    stages: strategy === 'auto' ? getStages(period) : [],
    coins,
  }
}

export function getCalendar(from: string, to: string): DayStat[] {
  return indexDayRange(from < DATA_START ? DATA_START : from, to > LAST_ISO ? LAST_ISO : to).map((d) => ({ d: d.d, pct: round(d.pct, 2), trades: d.trades }))
}

export function getRecords(period: PeriodKey): Records {
  const { from, to } = periodRange(period)
  return recordsFor(from, to, period)
}

function recordsFor(from: string, to: string, key: string): Records {
  const days = getCalendar(from, to)
  const best = days.reduce((a, d) => (d.pct > a.pct ? d : a), days[0] ?? { d: to, pct: 0, trades: 0 })
  const months = monthsInRange(from, to).filter((ym) => ym < CURRENT_YM || monthsInRange(from, to).length === 1)
  const monthVals = months.map((ym) => ({ ym, pct: round(SEGMENT_ORDER.reduce((a, s) => a + segmentMonthModel(s, ym) * monthElapsed(ym) * SEGMENT_WEIGHT[s], 0), 2) }))
  const bestMonth = monthVals.reduce((a, m) => (m.pct > a.pct ? m : a), monthVals[0] ?? { ym: CURRENT_YM, pct: 0 })
  const coinVals = PORTFOLIO.map((c) => ({ symbol: c.symbol, pct: coinRangeReturn(c.symbol, 'LONG', from, to).pct }))
  const bestCoin = coinVals.reduce((a, c) => (c.pct > a.pct ? c : a), coinVals[0])
  const pickDay = (k: string) => days[Math.floor(rand(k) * Math.max(1, days.length))]?.d ?? to
  const bestSym = [...AUTO_UNIVERSE, ...PORTFOLIO.map((c) => c.symbol)][Math.floor(rand(`bts:${key}`) * 20)]
  const worstSym = AUTO_UNIVERSE[Math.floor(rand(`wts:${key}`) * AUTO_UNIVERSE.length)]
  const spanDays = Math.max(1, days.length)
  return {
    bestTrade: { symbol: bestSym, date: pickDay(`btd:${key}`), pct: round(24 + rand(`btp:${key}`) * 26, 2), strategy: 'auto' },
    worstTrade: { symbol: worstSym, date: pickDay(`wtd:${key}`), pct: round(-(38 + rand(`wtp:${key}`) * 44), 2), strategy: 'auto' },
    bestDay: { date: best.d, pct: best.pct, trades: best.trades },
    bestMonth,
    bestCoin,
    streak: Math.round(Math.min(spanDays * 26, 140 + rand(`stk:${key}`) * 900)),
  }
}

export function getSpotComparison(months: number): SpotComparison {
  const endYM = CURRENT_YM
  const startYM = addMonthsYM(endYM, -(months - 1))
  const yms = monthList().filter((ym) => ym >= startYM && ym <= endYM)
  const rows = PORTFOLIO.slice(0, 15).map((c) => {
    let spot = 1
    let algo = 0
    for (const ym of yms) {
      spot *= 1 + (spotMonth(c.symbol, ym) * monthElapsed(ym)) / 100
      algo += coinMonth(c.symbol, 'LONG', ym) ?? 0
    }
    return { symbol: c.symbol, name: coinName(c.symbol), spotPct: round((spot - 1) * 100, 2), algoPct: round(algo, 2) }
  })
  return {
    from: `${yms[0]}-01`,
    to: LAST_ISO,
    rows,
    spotIndexPct: round(rows.reduce((a, r) => a + r.spotPct, 0) / rows.length, 2),
    algoIndexPct: round(rows.reduce((a, r) => a + r.algoPct, 0) / rows.length, 2),
  }
}

function indexMonth(ym: string) {
  return round(SEGMENT_ORDER.reduce((a, s) => a + segmentMonthModel(s, ym) * monthElapsed(ym) * SEGMENT_WEIGHT[s], 0), 2)
}

export function getMonths(): MonthSummary[] {
  return monthList()
    .map((ym) => {
      const trades = Math.round(SEGMENT_ORDER.reduce((a, s) => a + segmentMonthTrades(s, ym), 0) * monthElapsed(ym))
      const coins = PORTFOLIO.map((c) => ({ symbol: c.symbol, pct: coinMonth(c.symbol, 'LONG', ym) ?? 0 }))
      const bestCoin = coins.reduce((a, c) => (c.pct > a.pct ? c : a), coins[0])
      return {
        ym,
        returnPct: indexMonth(ym),
        trades,
        winRate: round(clamp(97.9 + gauss(`mwr:${ym}`) * 0.5, 94, 99.9), 1),
        bestCoin,
        current: ym === CURRENT_YM,
      }
    })
    .reverse()
}

export function getMonthReport(ym: string): MonthReport | null {
  const all = monthList()
  const i = all.indexOf(ym)
  if (i < 0) return null
  const summary = getMonths().find((m) => m.ym === ym) as MonthSummary
  const { year, month0 } = ymParts(ym)
  const from = `${ym}-01`
  const to = `${ym}-${String(daysInMonth(year, month0)).padStart(2, '0')}`
  const coinsLong = getCoins({ ym, tier: 30, direction: 'LONG' }).slice(0, 15)
  const coinsShort = getCoins({ ym, tier: 30, direction: 'SHORT' }).slice(0, 15)
  const stagesAll = STAGE_ORDER.map((s) => {
    const trades = Math.round(autoMonthTrades(ym) * stageShares(ym)[s] * monthElapsed(ym))
    const p = STAGE_PROFILE[s]
    return {
      key: s,
      direction: STAGES[s].direction,
      trades,
      share: round(stageShares(ym)[s] * 100, 1),
      returnPct: round(stageMonthModel(s, ym) * monthElapsed(ym), 2),
      avgTradePct: p.avg,
      winRate: p.wr,
      deepShare: p.deep,
      maeMedPct: p.mae,
      maeP90Pct: p.mae * 2.6,
      durMedSec: p.dur * 3600,
      spark: [],
    }
  })
  return {
    ...summary,
    segments: SEGMENT_ORDER.map((s) => segmentStat(s, from, to > LAST_ISO ? LAST_ISO : to, ym)),
    coinsLong,
    coinsShort,
    top3: getTop3(ym),
    portfolioTop15Pct: round(coinsLong.reduce((a, c) => a + c.returnPct, 0) / coinsLong.length, 2),
    days: getCalendar(from, to),
    stages: stagesAll,
    records: recordsFor(from, to > LAST_ISO ? LAST_ISO : to, ym),
    prev: i > 0 ? all[i - 1] : null,
    next: i < all.length - 1 ? all[i + 1] : null,
  }
}

export function getSegmentSeries(): SegmentMonthSeries[] {
  return SEGMENT_ORDER.map((s) => ({ key: s, months: monthList().map((ym) => ({ ym, pct: round(segmentMonthModel(s, ym) * monthElapsed(ym), 2) })) }))
}

/** Первый полный день данных — для подписей «с …». */
export const DATA_START_DATE = START_DATE
