/**
 * Контракт данных раздела «Результаты».
 *
 * Все показатели — сводные по всем пользователям платформы (только реальные счета, демо не участвуют).
 * Проценты считаются к выделенной сумме боту (как в «Статистике» кабинета: «% к депозиту»)
 * и не учитывают подушку на счете. Значения — числа в процентах: 6.35 означает +6,35%.
 * Даты — строки ISO: день "YYYY-MM-DD", месяц "YYYY-MM".
 *
 * Бэкенду достаточно реализовать функции из src/api/index.ts — интерфейс UI от них не зависит.
 */

/** Период выборки. Совпадает с сегментами «Статистики» кабинета. */
export type PeriodKey = '7d' | '30d' | '90d' | '365d' | 'all'

/** Стратегия бота: монету выбирает пользователь (Manual) или бот по сигналам скринера (Auto). */
export type StrategyKey = 'manual' | 'auto'

export type Direction = 'LONG' | 'SHORT'

/** Сегмент портфеля — единица сравнения на страницах. */
export type SegmentKey = 'manual_long' | 'manual_short' | 'auto'

/** Стадии скринера, по которым DCA · Auto открывает сделки. */
export type StageKey = 'PUMP' | 'RIDE' | 'RUN' | 'CRASH' | 'FLIP' | 'DUMP' | 'EARLY'

/** Режим закрытия позиций: conservative — «Ранний», normal — «Обычный», aggressive — «Агрессивный». */
export type ExitModeKey = 'conservative' | 'normal' | 'aggressive' | 'overkill'

/** Причина закрытия сделки — как в журнале кабинета. */
export type CloseReason = 'take' | 'basket' | 'liq' | 'stop'

export type ExchangeKey = 'bybit' | 'binance' | 'bitget' | 'okx'

/** Состав портфеля скринера. */
export type TierKey = 10 | 20 | 30

export type RiskLevel = 'moderate' | 'elevated' | 'very_high'

export interface Summary {
  period: PeriodKey
  from: string
  to: string
  /** Время последнего расчета, ISO datetime. */
  updatedAt: string
  /** Результат индекса DSTrade за период, % к выделенной сумме. */
  returnPct: number
  /** Сумма закрытого результата всех пользователей, USDT (после комиссий биржи и фандинга). */
  profitUsd: number
  /** Изменение цены BTC на споте за тот же период, %. */
  benchmarkPct: number
  trades: number
  tradesPerDay: number
  wins: number
  losses: number
  /** Доля прибыльных сделок, 0–100. */
  winRate: number
  /** Средний результат сделки, % к выделенной сумме. */
  avgTradePct: number
  avgWinPct: number
  avgLossPct: number
  avgDurationSec: number
  avgDurationWinSec: number
  avgDurationLossSec: number
  /** Боты, у которых была хотя бы одна сделка за период. */
  activeBots: number
  accounts: number
  /** Суммарный оборот закрытых сделок, USDT. */
  volumeUsd: number
  /** Комиссии бирж и фандинг, % к выделенной сумме (фандинг может быть в плюс). */
  feesPct: number
  fundingPct: number
  /** Доли причин закрытия, 0–100, в сумме 100. */
  closeReasons: Record<CloseReason, number>
}

export interface EquityPoint {
  /** День, YYYY-MM-DD. */
  t: string
  /** Накопленный результат с начала периода, %. */
  v: number
  /** Накопленное изменение цены BTC на споте, %. */
  b: number
  /** Результат дня, %. */
  d: number
}

export interface SegmentStat {
  key: SegmentKey
  strategy: StrategyKey
  direction: Direction | null
  returnPct: number
  /** Средний результат месяца за период, %. */
  avgMonthPct: number
  trades: number
  winRate: number
  avgTradePct: number
  avgDurationSec: number
  /** Худшая просадка позиции (90-й перцентиль) от цены первого входа, %. Отрицательное число. */
  drawdownP90Pct: number
  /** Доля ликвидаций среди закрытых сделок, 0–100. */
  liqShare: number
  bots: number
  risk: RiskLevel
  /** Результаты последних месяцев (старые → новые), %. Для спарклайна. */
  spark: number[]
}

export interface MatrixRow {
  key: string
  label: string
  /** Для строк-монет — тикер без USDT. */
  symbol?: string
  stage?: StageKey
  /** Результат по месяцам: индекс 0 — январь. null — нет данных (месяц не наступил или монета не торговалась). */
  values: (number | null)[]
  /** Итого % за год. */
  total: number
  /** Средний % в месяц. */
  avg: number
}

export interface MonthlyMatrix {
  year: number
  rows: MatrixRow[]
  /** «Итого к портфелю, %» — среднее по строкам. */
  footer: MatrixRow
}

export interface CoinStat {
  symbol: string
  name: string
  /** Место по капитализации в составе портфеля скринера. */
  rank: number
  tier: TierKey
  exchanges: ExchangeKey[]
  trades: number
  returnPct: number
  winRate: number
  avgDurationSec: number
  drawdownP90Pct: number
  /** Изменение цены на споте за тот же период, %. */
  spotPct: number
  /** Результат по месяцам за последние 12 месяцев (старые → новые). */
  spark: number[]
}

export interface TopCoin {
  symbol: string
  name: string
  trades: number
  returnPct: number
  /** Стратегия, давшая основной результат. */
  strategy: StrategyKey
  direction: Direction
  stage?: StageKey
}

export interface CoinMonth {
  ym: string
  long: number | null
  short: number | null
  tradesLong: number
  tradesShort: number
  spot: number
}

export interface CoinDetail {
  symbol: string
  name: string
  rank: number
  tier: TierKey
  exchanges: ExchangeKey[]
  months: CoinMonth[]
  long: CoinDirectionStat
  short: CoinDirectionStat
}

export interface CoinDirectionStat {
  returnPct12m: number
  avgMonthPct: number
  trades12m: number
  winRate: number
  avgDurationSec: number
  drawdownP90Pct: number
  bestMonth: { ym: string; pct: number }
  worstMonth: { ym: string; pct: number }
}

export interface StageStat {
  key: StageKey
  direction: Direction
  trades: number
  /** Доля сделок стадии среди сделок DCA · Auto, 0–100. */
  share: number
  returnPct: number
  avgTradePct: number
  winRate: number
  /** Доля сделок, дошедших до веса 6 и более, 0–100. */
  deepShare: number
  /** Ход цены против позиции от веса 0: медиана и 90-й перцентиль, %. */
  maeMedPct: number
  maeP90Pct: number
  durMedSec: number
  spark: number[]
}

export interface ExitModeStat {
  key: ExitModeKey
  trades: number
  share: number
  avgTradePct: number
  winRate: number
  avgDurationSec: number
  /** Средний максимальный вес позиции к закрытию. */
  avgMaxWeight: number
  returnPct: number
}

export interface WeightBucket {
  /** Максимальный вес, до которого дошла сделка: 0–8. */
  weight: number
  share: number
  avgTradePct: number
}

export interface ExchangeStat {
  key: ExchangeKey
  trades: number
  share: number
  returnPct: number
}

export interface StrategyDetail {
  strategy: StrategyKey
  direction: Direction | 'ALL'
  period: PeriodKey
  segment: SegmentStat
  equity: EquityPoint[]
  exitModes: ExitModeStat[]
  weights: WeightBucket[]
  closeReasons: Record<CloseReason, number>
  exchanges: ExchangeStat[]
  /** Только для DCA · Auto. */
  stages: StageStat[]
  /** Только для DCA · Manual: лучшие монеты периода. */
  coins: { symbol: string; name: string; returnPct: number; trades: number }[]
}

export interface DayStat {
  d: string
  pct: number
  trades: number
}

export interface Records {
  bestTrade: { symbol: string; date: string; pct: number; strategy: StrategyKey }
  worstTrade: { symbol: string; date: string; pct: number; strategy: StrategyKey }
  bestDay: { date: string; pct: number; trades: number }
  bestMonth: { ym: string; pct: number }
  bestCoin: { symbol: string; pct: number }
  /** Серия подряд закрытых в плюс сделок в пределах периода. */
  streak: number
}

export interface SpotComparison {
  from: string
  to: string
  rows: { symbol: string; name: string; spotPct: number; algoPct: number }[]
  spotIndexPct: number
  algoIndexPct: number
}

export interface MonthSummary {
  ym: string
  /** Прибыль портфеля, % за месяц (индекс DSTrade). */
  returnPct: number
  trades: number
  winRate: number
  bestCoin: { symbol: string; pct: number }
  /** Месяц еще идет. */
  current: boolean
}

export interface MonthReport extends MonthSummary {
  segments: SegmentStat[]
  coinsLong: CoinStat[]
  coinsShort: CoinStat[]
  top3: TopCoin[]
  /** «Прибыль портфеля, % за месяц» по Топ-15 DCA · Manual LONG — как в таблице доходности. */
  portfolioTop15Pct: number
  days: DayStat[]
  stages: StageStat[]
  records: Records
  prev: string | null
  next: string | null
}

/** Ряд для симулятора: результаты сегментов по месяцам. */
export interface SegmentMonthSeries {
  key: SegmentKey
  months: { ym: string; pct: number }[]
}
