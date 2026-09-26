import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { api } from '../../api'
import type { PeriodKey, SegmentStat } from '../../api/types'
import { Sparkline } from '../../components/charts/Sparkline'
import { DirBadge, RiskBadge } from '../../components/ui/Badges'
import { PeriodSwitch } from '../../components/ui/PeriodSwitch'
import { Section } from '../../components/ui/Section'
import { ErrorState, Skeleton } from '../../components/ui/States'
import { SEGMENTS, periodLong } from '../../content/dictionary'
import { fmtDuration, fmtNum, fmtPct } from '../../lib/format'
import { useAsync } from '../../lib/useAsync'

function StrategyCard({ s, period }: { s: SegmentStat; period: PeriodKey }) {
  const meta = SEGMENTS[s.key]
  const featured = s.key === 'auto'
  const to = `/strategies?s=${meta.strategy}${meta.direction ? `&dir=${meta.direction}` : ''}&p=${period}`
  return (
    <article className={`strat-card pub-hover ${featured ? 'featured' : ''}`}>
      <div className="strat-card-top">
        <div className="strat-card-name">
          <h3>{meta.title}</h3>
          <DirBadge dir={meta.direction ?? 'ALL'} />
        </div>
        <RiskBadge risk={s.risk} />
      </div>
      <div className="strat-card-desc">
        <p className="strat-card-note">{meta.note}</p>
        {featured && (
          <p className="strat-card-warn">
            <AlertTriangle size={14} aria-hidden="true" /> Внимание! Высокий уровень риска!
          </p>
        )}
      </div>
      <div className="strat-card-value">
        <strong className={`num ${s.avgMonthPct >= 0 ? 'up' : 'down'}`}>{fmtPct(s.avgMonthPct)}</strong>
        <small>в среднем за месяц</small>
      </div>
      <div className="strat-card-total">
        <span>
          {periodLong(period)}: <b className={`num ${s.returnPct >= 0 ? 'up' : 'down'}`}>{fmtPct(s.returnPct)}</b>
        </span>
        <span className="strat-card-spark" title="Результат за последние 12 месяцев">
          <Sparkline values={s.spark} width={96} height={26} />
        </span>
      </div>
      <ul>
        <li>
          <span>Доля прибыльных</span>
          <b className="num">{fmtNum(s.winRate, 1)}%</b>
        </li>
        <li>
          <span>Средняя сделка</span>
          <b className="num up">{fmtPct(s.avgTradePct)}</b>
        </li>
        <li>
          <span>Среднее время сделки</span>
          <b className="num">{fmtDuration(s.avgDurationSec)}</b>
        </li>
        <li>
          <span>Просадка позиции, худшие 10%</span>
          <b className="num down">{fmtPct(s.drawdownP90Pct, 1)}</b>
        </li>
        <li>
          <span>Ликвидации</span>
          <b className="num">{fmtNum(s.liqShare, 2)}% сделок</b>
        </li>
        <li>
          <span>Ботов в работе</span>
          <b className="num">{fmtNum(s.bots)}</b>
        </li>
      </ul>
      <Link className={`pub-btn pub-block ${featured ? 'pub-primary' : ''}`} to={to}>
        Разбор стратегии <span className="pub-arrow" aria-hidden="true">↗</span>
      </Link>
    </article>
  )
}

export function StrategyCards() {
  const [period, setPeriod] = useState<PeriodKey>('365d')
  const q = useAsync(() => api.segments(period), [period])
  return (
    <Section
      id="strategies"
      eyebrow="02 / Стратегии"
      title={
        <>
          Выберите подход.
          <br />
          <span className="pub-accent">Сравните итог.</span>
        </>
      }
      text="Две стратегии усреднения: монету выбираете вы или бот по сигналам скринера. Ниже — средний результат всех ботов каждой стратегии."
      side={<PeriodSwitch value={period} onChange={setPeriod} only={['30d', '90d', '365d', 'all']} />}
    >
      {q.error && !q.data ? (
        <ErrorState onRetry={q.reload} />
      ) : !q.data ? (
        <div className="strat-grid">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} h={520} r={16} />
          ))}
        </div>
      ) : (
        <div className={`strat-grid ${q.refreshing ? 'is-refreshing' : ''}`}>
          {q.data.map((s) => (
            <StrategyCard key={s.key} s={s} period={period} />
          ))}
        </div>
      )}
      <p className="pub-note strat-foot">
        Проценты — к сумме, выделенной боту, без учета подушки на счете. «Просадка позиции» — насколько цена уходила против позиции до закрытия в худших 10% сделок.
      </p>
    </Section>
  )
}
