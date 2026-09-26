import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Coins, Flame, TrendingDown, TrendingUp, Trophy } from 'lucide-react'
import { api } from '../../api'
import type { PeriodKey, Records } from '../../api/types'
import { CalendarHeat } from '../../components/charts/CalendarHeat'
import { PeriodSwitch } from '../../components/ui/PeriodSwitch'
import { Section } from '../../components/ui/Section'
import { ErrorState, Skeleton } from '../../components/ui/States'
import { periodLong } from '../../content/dictionary'
import { addDays, fmtDateShort, parseISODate, toISODate, ymTitle } from '../../lib/dates'
import { lastISO } from '../../lib/clock'
import { fmtNum, fmtPct, plural } from '../../lib/format'
import { useAsync } from '../../lib/useAsync'

export function RecordsList({ r }: { r: Records }) {
  const items = [
    { icon: <TrendingUp size={15} />, bg: 'rgba(52,211,153,.12)', color: 'var(--up)', t: 'Лучшая сделка', w: `${r.bestTrade.symbol} · ${fmtDateShort(r.bestTrade.date)}`, v: fmtPct(r.bestTrade.pct), cls: 'up' },
    { icon: <TrendingDown size={15} />, bg: 'rgba(251,113,133,.12)', color: 'var(--down)', t: 'Худшая сделка', w: `${r.worstTrade.symbol} · ${fmtDateShort(r.worstTrade.date)}`, v: fmtPct(r.worstTrade.pct), cls: 'down' },
    {
      icon: <CalendarDays size={15} />,
      bg: 'rgba(167,139,250,.14)',
      color: 'var(--acc)',
      t: 'Лучший день',
      w: `${fmtDateShort(r.bestDay.date)} · ${fmtNum(r.bestDay.trades)} ${plural(r.bestDay.trades, 'сделка', 'сделки', 'сделок')}`,
      v: fmtPct(r.bestDay.pct),
      cls: 'up',
    },
    { icon: <Trophy size={15} />, bg: 'rgba(251,191,36,.12)', color: 'var(--warn)', t: 'Лучший месяц', w: ymTitle(r.bestMonth.ym), v: fmtPct(r.bestMonth.pct), cls: 'up' },
    { icon: <Coins size={15} />, bg: 'rgba(34,211,238,.12)', color: 'var(--unl)', t: 'Лучшая монета', w: `${r.bestCoin.symbol} · DCA · Manual LONG`, v: fmtPct(r.bestCoin.pct), cls: 'up' },
    { icon: <Flame size={15} />, bg: 'rgba(240,136,62,.13)', color: 'var(--stage-early)', t: 'Серия без убытка', w: 'подряд закрытых в плюс', v: `${fmtNum(r.streak)} ${plural(r.streak, 'сделка', 'сделки', 'сделок')}`, cls: '' },
  ]
  return (
    <div className="recs">
      {items.map((it) => (
        <div className="rec" key={it.t}>
          <div className="ic" style={{ background: it.bg, color: it.color }} aria-hidden="true">
            {it.icon}
          </div>
          <div className="m">
            <div className="t">{it.t}</div>
            <div className="w">{it.w}</div>
          </div>
          <div className={`v num ${it.cls}`}>{it.v}</div>
        </div>
      ))}
    </div>
  )
}

export function CalendarSection() {
  const [period, setPeriod] = useState<PeriodKey>('90d')
  const from = toISODate(addDays(parseISODate(lastISO), -181))
  const cal = useAsync(() => api.calendar(from, lastISO), [from])
  const rec = useAsync(() => api.records(period), [period])
  const months = useAsync(() => api.months(), [])
  const lastMonths = (months.data ?? []).slice(0, 6).reverse()
  const days = cal.data ?? []
  const green = days.filter((d) => d.pct >= 0).length

  return (
    <Section
      id="days"
      eyebrow="06 / По дням"
      title={
        <>
          Каждый день.
          <br />
          <span className="pub-accent">На виду.</span>
        </>
      }
      text="Итог индекса DSTrade по дням за последние полгода и рекорды выбранного периода — как календарь прибыли в статистике кабинета."
    >
      <div className="pub-grid g-7-5">
        <div className="pub-panel pad">
          <div className="pub-panel-h">
            <h3>Календарь прибыли</h3>
            {cal.data && (
              <span className="pub-caption">
                {green} из {days.length} {plural(days.length, 'дня', 'дней', 'дней')} в плюс
              </span>
            )}
          </div>
          {cal.error && !cal.data ? <ErrorState onRetry={cal.reload} /> : !cal.data ? <Skeleton h={150} /> : <CalendarHeat days={days} ariaLabel="Календарь результата по дням" />}
          <div className="pub-panel-foot cal-foot">
            <span>Каждая клетка — итог дня всех ботов, % к выделенной сумме.</span>
            <span className="pub-heat-legend">
              <span>минус</span>
              <i aria-hidden="true" />
              <span>плюс</span>
            </span>
          </div>
          <div className="pub-panel-h" style={{ marginTop: 18 }}>
            <h3>Итог месяца</h3>
            <span className="pub-caption">индекс DSTrade</span>
          </div>
          <div className="month-tiles">
            {lastMonths.length
              ? lastMonths.map((m) => (
                  <Link key={m.ym} to={`/reports/${m.ym}`} className="month-tile">
                    <span>{ymTitle(m.ym).split(' ')[0]}</span>
                    <b className={`num ${m.returnPct >= 0 ? 'up' : 'down'}`}>{fmtPct(m.returnPct, 1)}</b>
                    <small>{m.current ? 'идет' : `${fmtNum(m.winRate, 1)}% в плюс`}</small>
                  </Link>
                ))
              : Array.from({ length: 6 }, (_, i) => <Skeleton key={i} h={70} r={10} />)}
          </div>
        </div>
        <div className="pub-panel pad">
          <div className="pub-panel-h">
            <h3>Рекорды периода</h3>
            <PeriodSwitch value={period} onChange={setPeriod} size="xs" only={['30d', '90d', '365d', 'all']} />
          </div>
          {rec.error && !rec.data ? (
            <ErrorState onRetry={rec.reload} />
          ) : !rec.data ? (
            <Skeleton h={330} />
          ) : (
            <div className={rec.refreshing ? 'is-refreshing' : ''}>
              <RecordsList r={rec.data} />
              <p className="pub-note" style={{ marginTop: 12 }}>
                Рекорды {periodLong(period)}. Худшая сделка — тоже часть статистики: так выглядит риск стратегии усреднения.
              </p>
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}
