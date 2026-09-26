import type { CloseReason, Direction, ExchangeKey, ExitModeKey, PeriodKey, RiskLevel, SegmentKey, StageKey, StrategyKey } from '../api/types'

/** Стадии скринера — названия, профили и описания из кабинета DSTrade. */
export const STAGES: Record<StageKey, { name: string; tone: string; profile: string; desc: string; direction: Direction; risk: RiskLevel }> = {
  PUMP: { name: 'PUMP', tone: 'pump', profile: 'Ранняя', desc: 'Лонг пампа: вход на ранней фазе роста, до перегрева.', direction: 'LONG', risk: 'elevated' },
  RIDE: { name: 'RIDE', tone: 'ride', profile: 'Ранний лонг', desc: 'Лонг раннего разгона монеты. Узкое торговое окно — стадия короткая.', direction: 'LONG', risk: 'elevated' },
  RUN: { name: 'RUN', tone: 'run', profile: 'Импульсная', desc: 'Импульс роста: лонг по тренду вверх.', direction: 'LONG', risk: 'elevated' },
  CRASH: { name: 'CRASH', tone: 'crash', profile: 'Контртрендовая', desc: 'Лонг после скама цены токена. Высокий риск: возможно продолжение падения.', direction: 'LONG', risk: 'very_high' },
  FLIP: { name: 'FLIP', tone: 'flip', profile: 'Консервативная', desc: 'Фейд зрелого пампа: шорт разворота. Реже остальных набирает объем.', direction: 'SHORT', risk: 'moderate' },
  DUMP: { name: 'DUMP', tone: 'dump', profile: 'Трендовая', desc: 'Слив после пика: шорт по тренду вниз.', direction: 'SHORT', risk: 'elevated' },
  EARLY: { name: 'EARLY', tone: 'early', profile: 'Агрессивная', desc: 'Ранний шорт слома пампа. Доходнее, но веса набираются быстрее.', direction: 'SHORT', risk: 'very_high' },
}

export const STAGE_ORDER: StageKey[] = ['PUMP', 'RIDE', 'RUN', 'CRASH', 'FLIP', 'DUMP', 'EARLY']

/** Режимы закрытия позиций. Буква — как в колонке «Вес» обзора кабинета (Р / О / А). */
export const EXIT_MODES: Record<ExitModeKey, { name: string; letter: string; full: string; desc: string; plus: boolean }> = {
  conservative: {
    name: 'Ранний',
    letter: 'Р',
    full: 'Ранний режим закрытия позиций',
    desc: 'Фиксирует результат при первой возможности. Короче сделки, меньше средний профит.',
    plus: false,
  },
  normal: {
    name: 'Обычный',
    letter: 'О',
    full: 'Стандартный режим закрытия позиций',
    desc: 'Баланс между скоростью закрытия и размером профита. Режим по умолчанию.',
    plus: false,
  },
  aggressive: {
    name: 'Агрессивный',
    letter: 'А',
    full: 'Поздний режим закрытия позиций',
    desc: 'Дает движению развиться дольше. Выше средний профит, дольше удержание.',
    plus: false,
  },
  overkill: {
    name: 'Overkill',
    letter: 'O',
    full: 'Режим Overkill',
    desc: 'Начинает поиск сигнала закрытия с третьей ступени весов закрытия — больше пространства сильным движениям.',
    plus: true,
  },
}

export const EXIT_ORDER: ExitModeKey[] = ['conservative', 'normal', 'aggressive', 'overkill']

/** Причины закрытия — цвета из журнала сделок кабинета. */
export const CLOSE_REASONS: Record<CloseReason, { label: string; color: string; bg: string; desc: string }> = {
  take: { label: 'Тейк-профит', color: 'var(--up)', bg: 'rgba(52,211,153,0.13)', desc: 'Позиция закрыта по сигналу закрытия с прибылью.' },
  basket: { label: 'Корзина', color: 'var(--warn)', bg: 'rgba(251,191,36,0.13)', desc: 'Закрытие всей корзины усреднений по общей цене безубытка и выше.' },
  liq: { label: 'Ликвидация', color: 'var(--down)', bg: 'rgba(251,113,133,0.13)', desc: 'Биржа принудительно закрыла позицию: маржи не хватило до цены ликвидации.' },
  stop: { label: 'Стоп-лосс', color: 'var(--sl)', bg: 'rgba(214,93,177,0.13)', desc: 'Сработал стоп-лосс, заданный пользователем.' },
}

export const CLOSE_ORDER: CloseReason[] = ['take', 'basket', 'stop', 'liq']

export const STRATEGIES: Record<StrategyKey, { name: string; note: string }> = {
  manual: { name: 'DCA · Manual', note: 'Монету и направление выбираете вы.' },
  auto: { name: 'DCA · Auto', note: 'Монету и направление бот выбирает автоматически.' },
}

export const SEGMENTS: Record<SegmentKey, { title: string; strategy: StrategyKey; direction: Direction | null; short: string; note: string }> = {
  manual_long: { title: 'DCA · Manual', strategy: 'manual', direction: 'LONG', short: 'Manual LONG', note: 'Вы выбираете монету из портфеля и открываете лонг. Бот докупает по сетке весов и закрывает по сигналу.' },
  manual_short: { title: 'DCA · Manual', strategy: 'manual', direction: 'SHORT', short: 'Manual SHORT', note: 'Тот же алгоритм усреднений в шорт: выбирайте монету, которую ждете ниже.' },
  auto: { title: 'DCA · Auto', strategy: 'auto', direction: null, short: 'Auto', note: 'Бот сам берет монеты и направление по стадиям скринера. Самые высокие результаты — и самый высокий риск.' },
}

export const SEGMENT_ORDER: SegmentKey[] = ['manual_long', 'manual_short', 'auto']

export const RISK: Record<RiskLevel, { label: string; tone: string }> = {
  moderate: { label: 'Умеренный', tone: 'up' },
  elevated: { label: 'Повышенный', tone: 'warn' },
  very_high: { label: 'Очень высокий', tone: 'down' },
}

export const EXCHANGES: Record<ExchangeKey, { name: string; logo: string }> = {
  bybit: { name: 'Bybit', logo: '/landing/bybit.svg' },
  binance: { name: 'Binance', logo: '/landing/binance.svg' },
  bitget: { name: 'Bitget', logo: '/landing/bitget.svg' },
  okx: { name: 'OKX', logo: '/landing/okx.svg' },
}

export const EXCHANGE_ORDER: ExchangeKey[] = ['bybit', 'binance', 'bitget', 'okx']

export const PERIODS: { key: PeriodKey; label: string; long: string }[] = [
  { key: '7d', label: '7Д', long: 'за 7 дней' },
  { key: '30d', label: '30Д', long: 'за 30 дней' },
  { key: '90d', label: '90Д', long: 'за 90 дней' },
  { key: '365d', label: 'Год', long: 'за год' },
  { key: 'all', label: 'Все', long: 'за все время' },
]

export const periodLong = (p: PeriodKey) => PERIODS.find((x) => x.key === p)?.long ?? ''

/** Состав портфеля скринера — формулировки раздела «Портфель». */
export const TIERS = [
  { key: 10 as const, label: 'Топ-10', note: 'Фундаментальные монеты' },
  { key: 20 as const, label: 'Топ-20', note: 'Расширенный состав' },
  { key: 30 as const, label: 'Топ-30', note: 'Все монеты портфеля' },
]
