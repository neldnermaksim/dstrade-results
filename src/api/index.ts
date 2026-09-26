/**
 * Единая точка получения данных для страниц «Результатов».
 *
 * VITE_DATA_SOURCE=mock (по умолчанию) — встроенные демо-данные из ./mock/generator.ts.
 * VITE_DATA_SOURCE=api — запросы к бэкенду по адресам ниже (база — VITE_API_BASE).
 * Формат ответов — типы из ./types.ts. Страницы ничего не знают об источнике.
 */
import type {
  CoinDetail,
  CoinStat,
  DayStat,
  Direction,
  EquityPoint,
  MonthReport,
  MonthSummary,
  MonthlyMatrix,
  PeriodKey,
  Records,
  SegmentMonthSeries,
  SegmentStat,
  SpotComparison,
  StageStat,
  StrategyDetail,
  StrategyKey,
  Summary,
  TierKey,
  TopCoin,
} from './types'

const SOURCE = (import.meta.env.VITE_DATA_SOURCE as string | undefined) ?? 'mock'
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api/v1/public/results'

/** Небольшая задержка, чтобы в демо были видны состояния загрузки. */
const MOCK_DELAY = 260

async function mock<T>(fn: (g: typeof import('./mock/generator')) => T): Promise<T> {
  const g = await import('./mock/generator')
  await new Promise((r) => setTimeout(r, MOCK_DELAY))
  return fn(g)
}

async function get<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined) q.set(k, String(v))
  const url = `${BASE}${path}${q.toString() ? `?${q}` : ''}`
  const res = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

const useMock = SOURCE !== 'api'

export const api = {
  /** GET {BASE}/summary?period=30d */
  summary: (period: PeriodKey): Promise<Summary> => (useMock ? mock((g) => g.getSummary(period)) : get('/summary', { period })),

  /** GET {BASE}/equity?period=30d — накопленный индекс DSTrade и BTC по дням. */
  equity: (period: PeriodKey): Promise<EquityPoint[]> => (useMock ? mock((g) => g.getEquity(period)) : get('/equity', { period })),

  /** GET {BASE}/segments?period=30d — DCA · Manual LONG, DCA · Manual SHORT, DCA · Auto. */
  segments: (period: PeriodKey): Promise<SegmentStat[]> => (useMock ? mock((g) => g.getSegments(period)) : get('/segments', { period })),

  /** GET {BASE}/monthly?year=2026&by=segments|coins|stages&direction=LONG&limit=15 */
  monthly: (year: number, by: 'segments' | 'coins' | 'stages', direction: Direction = 'LONG', limit = 15): Promise<MonthlyMatrix> =>
    useMock ? mock((g) => g.getMonthlyMatrix(year, by, direction, limit)) : get('/monthly', { year, by, direction, limit }),

  /** GET {BASE}/coins?tier=30&direction=LONG&period=30d | &month=2026-09 */
  coins: (opts: { period?: PeriodKey; ym?: string; tier: TierKey; direction: Direction }): Promise<CoinStat[]> =>
    useMock ? mock((g) => g.getCoins(opts)) : get('/coins', { tier: opts.tier, direction: opts.direction, period: opts.period, month: opts.ym }),

  /** GET {BASE}/coins/{symbol} */
  coin: (symbol: string): Promise<CoinDetail | null> => (useMock ? mock((g) => g.getCoinDetail(symbol)) : get(`/coins/${encodeURIComponent(symbol)}`)),

  /** GET {BASE}/top?month=2026-09 — топ-3 монеты месяца. */
  top3: (ym: string): Promise<TopCoin[]> => (useMock ? mock((g) => g.getTop3(ym)) : get('/top', { month: ym })),

  /** GET {BASE}/strategies/{manual|auto}?direction=LONG|SHORT|ALL&period=30d */
  strategy: (strategy: StrategyKey, direction: Direction | 'ALL', period: PeriodKey): Promise<StrategyDetail> =>
    useMock ? mock((g) => g.getStrategy(strategy, direction, period)) : get(`/strategies/${strategy}`, { direction, period }),

  /** GET {BASE}/stages?period=30d */
  stages: (period: PeriodKey): Promise<StageStat[]> => (useMock ? mock((g) => g.getStages(period)) : get('/stages', { period })),

  /** GET {BASE}/calendar?from=2026-03-01&to=2026-09-25 */
  calendar: (from: string, to: string): Promise<DayStat[]> => (useMock ? mock((g) => g.getCalendar(from, to)) : get('/calendar', { from, to })),

  /** GET {BASE}/records?period=30d */
  records: (period: PeriodKey): Promise<Records> => (useMock ? mock((g) => g.getRecords(period)) : get('/records', { period })),

  /** GET {BASE}/spot?months=6 — спот против DCA · Manual LONG по Топ-15. */
  spot: (months: number): Promise<SpotComparison> => (useMock ? mock((g) => g.getSpotComparison(months)) : get('/spot', { months })),

  /** GET {BASE}/reports — список месяцев, новые сверху. */
  months: (): Promise<MonthSummary[]> => (useMock ? mock((g) => g.getMonths()) : get('/reports')),

  /** GET {BASE}/reports/{YYYY-MM} */
  report: (ym: string): Promise<MonthReport | null> => (useMock ? mock((g) => g.getMonthReport(ym)) : get(`/reports/${ym}`)),

  /** GET {BASE}/series — результаты сегментов по месяцам для калькулятора. */
  series: (): Promise<SegmentMonthSeries[]> => (useMock ? mock((g) => g.getSegmentSeries()) : get('/series')),
}

export const DATA_SOURCE = useMock ? 'mock' : 'api'
