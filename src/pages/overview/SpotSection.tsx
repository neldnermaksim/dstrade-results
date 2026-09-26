import { useState } from 'react'
import { api } from '../../api'
import { CoinIcon } from '../../components/ui/CoinIcon'
import { Hint } from '../../components/ui/Hint'
import { Segmented } from '../../components/ui/Segmented'
import { Section } from '../../components/ui/Section'
import { ErrorState, Skeleton, Updating } from '../../components/ui/States'
import { Pct } from '../../components/ui/Value'
import { fmtDate } from '../../lib/dates'
import { currentYM } from '../../lib/clock'
import { fmtPct } from '../../lib/format'
import { useAsync } from '../../lib/useAsync'

export function SpotSection() {
  const ytd = Number(currentYM.slice(5, 7))
  const [months, setMonths] = useState(ytd >= 3 ? ytd : 6)
  const q = useAsync(() => api.spot(months), [months])
  const d = q.data
  const max = d ? Math.max(...d.rows.flatMap((r) => [Math.abs(r.spotPct), Math.abs(r.algoPct)]), 1) : 1

  return (
    <Section
      id="spot"
      eyebrow="04 / Алгоритм и рынок"
      title={
        <>
          Цена монеты.
          <br />
          <span className="pub-accent">Результат алгоритма.</span>
        </>
      }
      text="Как менялась цена монет портфеля на споте и сколько за тот же период принес DCA · Manual LONG на этих же монетах."
    >
      <div className="pub-toolbar">
        <Segmented
          label="Период сравнения"
          value={months}
          onChange={setMonths}
          options={[
            { value: 3, label: '3 месяца' },
            { value: 6, label: '6 месяцев' },
            ...(ytd >= 3 && ytd !== 3 && ytd !== 6 && ytd !== 12 ? [{ value: ytd, label: 'С начала года' }] : []),
            { value: 12, label: '12 месяцев' },
          ]}
        />
        <Updating on={q.refreshing} />
      </div>

      {q.error && !d ? (
        <ErrorState onRetry={q.reload} />
      ) : !d ? (
        <Skeleton h={560} r={16} />
      ) : (
        <div className={`spot-layout ${q.refreshing ? 'is-refreshing' : ''}`}>
          <div className="pub-panel pad glow spot-summary">
            <div className="pub-caption">
              {fmtDate(d.from)} — {fmtDate(d.to)} · Топ-15 портфеля
            </div>
            <div className="spot-big">
              <div>
                <span>
                  Индекс спота
                  <Hint>Среднее изменение цены 15 крупнейших монет портфеля: купили на споте в начале периода и держали до конца.</Hint>
                </span>
                <strong className={`num ${d.spotIndexPct >= 0 ? 'up' : 'down'}`}>{fmtPct(d.spotIndexPct)}</strong>
              </div>
              <div>
                <span>
                  Индекс алгоритма
                  <Hint>Средний результат DCA · Manual LONG по тем же 15 монетам за тот же период, % к выделенной сумме.</Hint>
                </span>
                <strong className={`num ${d.algoIndexPct >= 0 ? 'up' : 'down'}`}>{fmtPct(d.algoIndexPct)}</strong>
              </div>
            </div>
            <div className="spot-diff">
              <span className="pub-caption">Разница</span>
              <b className="num acc">{fmtPct(d.algoIndexPct - d.spotIndexPct, 1).replace('%', ' п.п.')}</b>
            </div>
            <p className="pub-note">
              Алгоритм зарабатывает на колебаниях цены: покупает частями на снижении и закрывает на отскоке. Поэтому результат слабее зависит от того, куда в итоге ушла
              цена. На сильном падении без отскоков возможны убытки и ликвидации.
            </p>
            <div className="pub-legend">
              <span>
                <i className="sq" style={{ background: 'rgba(139,155,184,.6)' }} />
                Спот
              </span>
              <span>
                <i className="sq" style={{ background: '#a78bfa' }} />
                DCA · Manual LONG
              </span>
            </div>
          </div>

          <div className="pub-panel pad spot-rows" role="table" aria-label="Спот и алгоритм по монетам">
            <div className="spot-row spot-row-head" role="row">
              <span role="columnheader">Монета</span>
              <span role="columnheader">Спот</span>
              <span role="columnheader">Алгоритм</span>
            </div>
            {d.rows.map((r) => (
              <div key={r.symbol} className="spot-row" role="row">
                <span className="coin" role="cell">
                  <CoinIcon symbol={r.symbol} />
                  <span className="coin-sym">{r.symbol}</span>
                </span>
                <span className="spot-cell" role="cell">
                  <span className="spot-track">
                    <span className="spot-zero" />
                    <span
                      className={`spot-bar spot ${r.spotPct < 0 ? 'neg' : ''}`}
                      style={
                        r.spotPct >= 0
                          ? { left: '50%', width: `${(r.spotPct / max) * 50}%` }
                          : { right: '50%', width: `${(Math.abs(r.spotPct) / max) * 50}%` }
                      }
                    />
                  </span>
                  <Pct v={r.spotPct} digits={1} />
                </span>
                <span className="spot-cell" role="cell">
                  <span className="spot-track">
                    <span className="spot-zero" />
                    <span
                      className={`spot-bar algo ${r.algoPct < 0 ? 'neg' : ''}`}
                      style={
                        r.algoPct >= 0
                          ? { left: '50%', width: `${(r.algoPct / max) * 50}%` }
                          : { right: '50%', width: `${(Math.abs(r.algoPct) / max) * 50}%` }
                      }
                    />
                  </span>
                  <Pct v={r.algoPct} digits={1} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}
