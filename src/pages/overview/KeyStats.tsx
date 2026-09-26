import { useState } from 'react'
import { api } from '../../api'
import type { PeriodKey } from '../../api/types'
import { CloseReasonsBar } from '../../components/charts/StackBar'
import { Kpi, KpiSkeleton } from '../../components/ui/Kpi'
import { PeriodSwitch } from '../../components/ui/PeriodSwitch'
import { Section } from '../../components/ui/Section'
import { ErrorState, Skeleton, Updating } from '../../components/ui/States'
import { periodLong } from '../../content/dictionary'
import { fmtDate } from '../../lib/dates'
import { fmtDuration, fmtNum, fmtPct, fmtUsd } from '../../lib/format'
import { useAsync } from '../../lib/useAsync'

export function KeyStats() {
  const [period, setPeriod] = useState<PeriodKey>('30d')
  const q = useAsync(() => api.summary(period), [period])
  const s = q.data

  return (
    <Section
      id="stats"
      eyebrow="01 / Все сделки платформы"
      title={
        <>
          Все сделки.
          <br />
          <span className="pub-accent">Одна картина.</span>
        </>
      }
      text="Итоги закрытых сделок всех ботов на реальных счетах. Те же показатели, что в разделе «Статистика» кабинета, — только по всей платформе сразу."
      side={<PeriodSwitch value={period} onChange={setPeriod} />}
    >
      {q.error && !s ? (
        <ErrorState onRetry={q.reload} />
      ) : !s ? (
        <>
          <KpiSkeleton n={6} />
          <div style={{ marginTop: 14 }}>
            <Skeleton h={150} />
          </div>
        </>
      ) : (
        <div className={q.refreshing ? 'is-refreshing' : ''}>
          <div className="stats-caption">
            <span className="pub-caption">
              {fmtDate(s.from)} — {fmtDate(s.to)} · {periodLong(period)}
            </span>
            <Updating on={q.refreshing} />
          </div>
          <div className="pub-kpis kpis-6">
            <Kpi
              label="Результат индекса"
              value={fmtPct(s.returnPct)}
              tone={s.returnPct >= 0 ? 'up' : 'down'}
              sub={
                <>
                  к выделенной сумме · BTC <b className={s.benchmarkPct >= 0 ? 'up' : 'down'}>{fmtPct(s.benchmarkPct)}</b>
                </>
              }
              hint="Взвешенный по выделенным суммам результат всех стратегий. Считается к сумме, выделенной ботам, без учета подушки на счете."
            />
            <Kpi
              label="Итог пользователей"
              value={fmtUsd(s.profitUsd, 0)}
              tone={s.profitUsd >= 0 ? 'up' : 'down'}
              sub={
                <>
                  на {fmtNum(s.accounts)} счетах · {fmtNum(s.activeBots)} ботов
                </>
              }
              hint="Сумма закрытого результата всех сделок после комиссий биржи и фандинга. Комиссия платформы с прибыльных сделок не вычтена."
            />
            <Kpi
              label="Сделок закрыто"
              value={fmtNum(s.trades)}
              sub={
                <>
                  <span className="up">{fmtNum(s.wins)} в плюс</span> · <span className="down">{fmtNum(s.losses)} в минус</span>
                  <br />в среднем {fmtNum(s.tradesPerDay, 0)} в день
                </>
              }
            />
            <Kpi label="Доля прибыльных" value={`${fmtNum(s.winRate, 1)}%`} meter={s.winRate} sub={`${fmtNum(s.wins)} из ${fmtNum(s.trades)} в плюс`} />
            <Kpi
              label="Средняя сделка"
              value={fmtPct(s.avgTradePct)}
              tone={s.avgTradePct >= 0 ? 'up' : 'down'}
              sub={
                <>
                  прибыльная <span className="up">{fmtPct(s.avgWinPct)}</span>
                  <br />
                  убыточная <span className="down">{fmtPct(s.avgLossPct)}</span>
                </>
              }
              hint="Средний результат одной сделки к выделенной боту сумме. Убыточных сделок мало, но каждая заметно глубже прибыльной — это свойство усреднения."
            />
            <Kpi
              label="Среднее время сделки"
              value={fmtDuration(s.avgDurationSec)}
              sub={
                <>
                  в прибыльных {fmtDuration(s.avgDurationWinSec)}
                  <br />в убыточных {fmtDuration(s.avgDurationLossSec)}
                </>
              }
            />
          </div>

          <div className="pub-grid g-7-5" style={{ marginTop: 14 }}>
            <div className="pub-panel pad">
              <div className="pub-panel-h">
                <h3>Причины закрытия</h3>
                <span className="pub-caption">доля сделок {periodLong(period)}</span>
              </div>
              <CloseReasonsBar data={s.closeReasons} />
            </div>
            <div className="pub-panel pad">
              <div className="pub-panel-h">
                <h3>Комиссии и фандинг</h3>
                <span className="pub-caption">к выделенной сумме</span>
              </div>
              <div className="metric-row">
                <span>Комиссии бирж</span>
                <b className="down num">{fmtPct(s.feesPct)}</b>
              </div>
              <div className="metric-row">
                <span>Фандинг</span>
                <b className={`num ${s.fundingPct >= 0 ? 'up' : 'down'}`}>{fmtPct(s.fundingPct)}</b>
              </div>
              <div className="metric-row">
                <span>Оборот закрытых сделок</span>
                <b className="num">{fmtUsd(s.volumeUsd, 0, false)}</b>
              </div>
              <p className="pub-panel-foot">Результат индекса уже учитывает комиссии бирж и фандинг. Комиссия платформы взимается отдельно и только с прибыльных сделок.</p>
            </div>
          </div>
        </div>
      )}
    </Section>
  )
}
