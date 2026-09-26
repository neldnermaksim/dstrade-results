import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { CoinIcon } from '../components/ui/CoinIcon'
import { Segmented } from '../components/ui/Segmented'
import { ErrorState, Skeleton } from '../components/ui/States'
import { ymParts, ymTitle, MONTHS } from '../lib/dates'
import { fmtNum, fmtPct } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { Closing } from './overview/Closing'

export default function Reports() {
  useDocumentTitle('Отчеты')
  const q = useAsync(() => api.months(), [])
  const years = useMemo(() => [...new Set((q.data ?? []).map((m) => Number(m.ym.slice(0, 4))))], [q.data])
  const [year, setYear] = useState<number | null>(null)
  const y = year ?? years[0]
  const list = (q.data ?? []).filter((m) => Number(m.ym.slice(0, 4)) === y)
  const max = Math.max(...list.map((m) => Math.abs(m.returnPct)), 1)
  const full = list.filter((m) => !m.current)
  const yearTotal = list.reduce((a, m) => a + m.returnPct, 0)
  const avg = full.length ? full.reduce((a, m) => a + m.returnPct, 0) / full.length : 0

  return (
    <div className="view-enter">
      <header className="pub-page-head">
        <div className="pub-wrap">
          <div className="pub-eyebrow">Результаты / Отчеты</div>
          <div className="pub-page-head-grid">
            <h1>
              Отчеты.
              <br />
              <span>Месяц за месяцем.</span>
            </h1>
            <p>
              Итоги каждого месяца: результат стратегий, топ-15 монет, топ-3 по прибыли и прибыль портфеля. Текущий месяц обновляется каждый день — остальные уже
              закрыты.
            </p>
          </div>
        </div>
      </header>

      <section className="pub-section pub-tight">
        <div className="pub-wrap">
          {q.error && !q.data ? (
            <ErrorState onRetry={q.reload} />
          ) : !q.data ? (
            <div className="report-grid">
              {Array.from({ length: 9 }, (_, i) => (
                <Skeleton key={i} h={190} r={16} />
              ))}
            </div>
          ) : (
            <>
              <div className="pub-toolbar">
                <Segmented label="Год" value={y} onChange={setYear} options={years.map((v) => ({ value: v, label: String(v) }))} />
                <div className="report-year-sum">
                  <span>
                    Итого за {y}: <b className={`num ${yearTotal >= 0 ? 'up' : 'down'}`}>{fmtPct(yearTotal)}</b>
                  </span>
                  <span>
                    В среднем за месяц: <b className="num">{fmtPct(avg)}</b>
                  </span>
                </div>
              </div>
              <div className="report-grid">
                {list.map((m) => {
                  const { month0 } = ymParts(m.ym)
                  return (
                    <Link key={m.ym} to={`/reports/${m.ym}`} className={`report-card pub-hover ${m.current ? 'current' : ''}`}>
                      <div className="report-card-head">
                        <h3>{MONTHS[month0]}</h3>
                        {m.current ? (
                          <span className="pub-pill acc">
                            <span className="pub-dot" />
                            идет
                          </span>
                        ) : (
                          <span className="pub-caption">{m.ym.slice(0, 4)}</span>
                        )}
                      </div>
                      <div className="report-card-value">
                        <strong className={`num ${m.returnPct >= 0 ? 'up' : 'down'}`}>{fmtPct(m.returnPct)}</strong>
                        <span className="pub-caption">индекс DSTrade</span>
                      </div>
                      <span className="report-bar" aria-hidden="true">
                        <i className={m.returnPct < 0 ? 'neg' : ''} style={{ width: `${(Math.abs(m.returnPct) / max) * 100}%` }} />
                      </span>
                      <div className="report-card-foot">
                        <span>
                          <b className="num">{fmtNum(m.trades)}</b> сделок
                        </span>
                        <span>
                          <b className="num">{fmtNum(m.winRate, 1)}%</b> в плюс
                        </span>
                        <span className="coin report-best" title="Лучшая монета портфеля, DCA · Manual LONG">
                          <CoinIcon symbol={m.bestCoin.symbol} />
                          <b>{m.bestCoin.symbol}</b>
                          <span className="up num">{fmtPct(m.bestCoin.pct, 1)}</span>
                        </span>
                      </div>
                      <span className="report-open">
                        Открыть отчет за {ymTitle(m.ym).toLowerCase()} <span aria-hidden="true">↗</span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </section>
      <Closing />
    </div>
  )
}
