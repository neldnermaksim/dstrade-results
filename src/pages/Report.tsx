import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Download, Link2 } from 'lucide-react'
import { api } from '../api'
import type { CoinStat, Direction, MonthReport } from '../api/types'
import { Bars } from '../components/charts/Bars'
import { MonthCalendar } from '../components/charts/MonthCalendar'
import { DirBadge, StageBadge } from '../components/ui/Badges'
import { CoinIcon } from '../components/ui/CoinIcon'
import { Kpi, KpiSkeleton } from '../components/ui/Kpi'
import { Segmented } from '../components/ui/Segmented'
import { ErrorState, Skeleton } from '../components/ui/States'
import { Pct } from '../components/ui/Value'
import { SEGMENTS } from '../content/dictionary'
import { ymTitle } from '../lib/dates'
import { fmtDuration, fmtNum, fmtPct } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { RecordsList } from './overview/CalendarSection'
import { TopCard } from './overview/TopCoinsSection'
import { Closing } from './overview/Closing'
import NotFound from './NotFound'

function toCsv(r: MonthReport) {
  const rows: string[][] = [
    [`DSTrade — отчет за ${ymTitle(r.ym)}`],
    [],
    ['Стратегия', 'Результат, %', 'Сделок', 'Доля прибыльных, %'],
    ...r.segments.map((s) => [SEGMENTS[s.key].short, s.returnPct.toFixed(2), String(s.trades), s.winRate.toFixed(1)]),
    [],
    ['Актив топ-15 (LONG)', 'Трейдов за месяц', 'Прибыль за месяц, %', 'Спот, %'],
    ...[...r.coinsLong].sort((a, b) => a.symbol.localeCompare(b.symbol)).map((c) => [c.symbol, String(c.trades), c.returnPct.toFixed(2), c.spotPct.toFixed(2)]),
    ['Прибыль портфеля, % за месяц', '', r.portfolioTop15Pct.toFixed(2)],
    [],
    ['Топ-3 по прибыли за месяц', 'Трейдов', 'Прибыль, %'],
    ...r.top3.map((c) => [c.symbol, String(c.trades), c.returnPct.toFixed(2)]),
  ]
  return '\uFEFF' + rows.map((row) => row.map((v) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(';')).join('\n')
}

function Top15({ coins, total, direction }: { coins: CoinStat[]; total: number; direction: Direction }) {
  const sorted = [...coins].sort((a, b) => a.symbol.localeCompare(b.symbol))
  const max = Math.max(...coins.map((c) => Math.abs(c.returnPct)), 1)
  return (
    <div className="pub-table-wrap">
      <table className="pub-table top15">
        <thead>
          <tr>
            <th>Актив топ-15</th>
            <th className="r">Трейдов за месяц</th>
            <th>Прибыль за месяц, %</th>
            <th className="r">Спот, %</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.symbol}>
              <td>
                <span className="coin">
                  <CoinIcon symbol={c.symbol} />
                  <span className="coin-sym">{c.symbol}</span>
                </span>
              </td>
              <td className="r num">{fmtNum(c.trades)}</td>
              <td>
                <span className="share-cell wide">
                  <span className="tier-bar">
                    <i className={c.returnPct < 0 ? 'neg' : ''} style={{ width: `${(Math.abs(c.returnPct) / max) * 100}%` }} />
                  </span>
                  <Pct v={c.returnPct} />
                </span>
              </td>
              <td className="r">
                <Pct v={c.spotPct} digits={1} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2}>
              Прибыль портфеля, % за месяц · <DirBadge dir={direction} />
            </td>
            <td colSpan={2}>
              <Pct v={total} className="top15-total" />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export default function Report() {
  const { ym = '' } = useParams()
  const valid = /^\d{4}-\d{2}$/.test(ym)
  useDocumentTitle(valid ? `Отчет за ${ymTitle(ym).toLowerCase()}` : 'Отчет')
  const q = useAsync(() => (valid ? api.report(ym) : Promise.resolve(null)), [ym])
  const [dir, setDir] = useState<Direction>('LONG')
  const [copied, setCopied] = useState(false)
  const r = q.data

  if (!valid || (q.data === null && !q.loading && !q.refreshing)) return <NotFound />

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Скопируйте ссылку на отчет', window.location.href)
    }
  }

  const download = () => {
    if (!r) return
    const blob = new Blob([toCsv(r)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `dstrade-report-${r.ym}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const coins = r ? (dir === 'LONG' ? r.coinsLong : r.coinsShort) : []
  const dirTotal = coins.length ? coins.reduce((a, c) => a + c.returnPct, 0) / coins.length : 0
  const spotAvg = coins.length ? coins.reduce((a, c) => a + c.spotPct, 0) / coins.length : 0

  return (
    <div className="view-enter">
      <header className="pub-page-head">
        <div className="pub-wrap">
          <Link to="/reports" className="pub-back">
            ← Все отчеты
          </Link>
          <div className="pub-eyebrow">Отчет / {valid ? ymTitle(ym) : ''}</div>
          <div className="report-head">
            <h1>
              {valid ? ymTitle(ym).split(' ')[0] : ''}
              <br />
              <span>{ym.slice(0, 4)}.</span>
            </h1>
            <div className="report-actions">
              {r?.current && (
                <span className="pub-pill acc">
                  <span className="pub-dot" />
                  Месяц идет — данные на вчера
                </span>
              )}
              <div className="report-nav">
                {r?.prev ? (
                  <Link className="pub-icon-btn" to={`/reports/${r.prev}`} aria-label={`Предыдущий месяц: ${ymTitle(r.prev)}`}>
                    <ChevronLeft size={18} />
                  </Link>
                ) : (
                  <span className="pub-icon-btn disabled" aria-hidden="true">
                    <ChevronLeft size={18} />
                  </span>
                )}
                {r?.next ? (
                  <Link className="pub-icon-btn" to={`/reports/${r.next}`} aria-label={`Следующий месяц: ${ymTitle(r.next)}`}>
                    <ChevronRight size={18} />
                  </Link>
                ) : (
                  <span className="pub-icon-btn disabled" aria-hidden="true">
                    <ChevronRight size={18} />
                  </span>
                )}
              </div>
              <button type="button" className="pub-btn pub-sm" onClick={share}>
                <Link2 size={15} aria-hidden="true" /> {copied ? 'Ссылка скопирована' : 'Поделиться'}
              </button>
              <button type="button" className="pub-btn pub-sm" onClick={download} disabled={!r}>
                <Download size={15} aria-hidden="true" /> CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="pub-section pub-tight">
        <div className="pub-wrap">
          {q.error && !r ? (
            <ErrorState onRetry={q.reload} />
          ) : !r ? (
            <>
              <KpiSkeleton n={5} />
              <div style={{ marginTop: 14 }}>
                <Skeleton h={420} r={16} />
              </div>
            </>
          ) : (
            <div className={q.refreshing ? 'is-refreshing' : ''}>
              <div className="pub-kpis">
                <Kpi label="Индекс DSTrade" value={fmtPct(r.returnPct)} tone={r.returnPct >= 0 ? 'up' : 'down'} sub="все стратегии, к выделенной сумме" />
                <Kpi label="Прибыль портфеля" value={fmtPct(r.portfolioTop15Pct)} tone={r.portfolioTop15Pct >= 0 ? 'up' : 'down'} sub="топ-15 · DCA · Manual LONG" />
                <Kpi label="Сделок закрыто" value={fmtNum(r.trades)} sub={`${fmtNum(Math.round(r.trades / Math.max(1, r.days.length)))} в день`} />
                <Kpi label="Доля прибыльных" value={`${fmtNum(r.winRate, 1)}%`} meter={r.winRate} />
                <Kpi label="Лучшая монета портфеля" value={r.bestCoin.symbol} sub={<Pct v={r.bestCoin.pct} />} />
              </div>

              <div className="pub-grid g-5-7" style={{ marginTop: 14 }}>
                <div className="pub-panel pad">
                  <div className="pub-panel-h">
                    <h3>Стратегии</h3>
                    <span className="pub-caption">результат месяца</span>
                  </div>
                  {r.segments.map((s) => (
                    <div key={s.key} className="seg-row">
                      <div>
                        <b>{SEGMENTS[s.key].title}</b> <DirBadge dir={s.direction ?? 'ALL'} />
                        <span className="pub-caption">
                          {fmtNum(s.trades)} сделок · {fmtNum(s.winRate, 1)}% в плюс · {fmtDuration(s.avgDurationSec)}
                        </span>
                      </div>
                      <Pct v={s.returnPct} className="seg-val" />
                    </div>
                  ))}
                  <div className="metrics-heading">Стадии DCA · Auto</div>
                  <Bars
                    ariaLabel="Результат стадий DCA · Auto за месяц"
                    items={[...r.stages]
                      .sort((a, b) => b.returnPct - a.returnPct)
                      .map((s) => ({ key: s.key, label: <StageBadge stage={s.key} />, value: s.returnPct, display: fmtPct(s.returnPct) }))}
                  />
                </div>
                <div className="report-right">
                  <div className="pub-panel-h" style={{ marginBottom: 10 }}>
                    <h3>Топ-3 по прибыли за месяц</h3>
                    <span className="pub-caption">среди всех монет, где работали боты</span>
                  </div>
                  <div className="coins-top-cards">
                    {r.top3.map((c, i) => (
                      <TopCard key={c.symbol} c={c} place={i + 1} />
                    ))}
                  </div>
                  <div className="pub-panel pad" style={{ marginTop: 14 }}>
                    <div className="pub-panel-h">
                      <h3>Итоги по дням</h3>
                      <span className="pub-caption">индекс DSTrade, % и число сделок</span>
                    </div>
                    <MonthCalendar ym={r.ym} days={r.days} />
                  </div>
                </div>
              </div>

              <div className="pub-grid g-7-5" style={{ marginTop: 14 }}>
                <div className="pub-panel pad">
                  <div className="pub-panel-h">
                    <h3>Актив топ-15 · DCA · Manual</h3>
                    <Segmented
                      label="Направление"
                      size="xs"
                      value={dir}
                      onChange={setDir}
                      options={[
                        { value: 'LONG', label: 'LONG' },
                        { value: 'SHORT', label: 'SHORT' },
                      ]}
                    />
                  </div>
                  <Top15 coins={coins} total={dir === 'LONG' ? r.portfolioTop15Pct : dirTotal} direction={dir} />
                </div>
                <div className="report-side">
                  <div className="pub-panel pad">
                    <div className="pub-panel-h">
                      <h3>Рекорды месяца</h3>
                    </div>
                    <RecordsList r={r.records} />
                  </div>
                  <div className="pub-panel pad glow">
                    <div className="pub-panel-h">
                      <h3>Алгоритм и рынок</h3>
                      <span className="pub-caption">топ-15 · {dir}</span>
                    </div>
                    <div className="spot-big">
                      <div>
                        <span>Индекс спота</span>
                        <strong className={`num ${spotAvg >= 0 ? 'up' : 'down'}`}>{fmtPct(spotAvg, 1)}</strong>
                      </div>
                      <div>
                        <span>Индекс алгоритма</span>
                        <strong className={`num ${dirTotal >= 0 ? 'up' : 'down'}`}>{fmtPct(dirTotal, 1)}</strong>
                      </div>
                    </div>
                    <p className="pub-note" style={{ marginTop: 12 }}>
                      Среднее изменение цены 15 монет за месяц и средний результат DCA · Manual {dir} на них же.
                    </p>
                  </div>
                </div>
              </div>
              <p className="pub-note" style={{ marginTop: 16 }}>
                Указаны усредненные проценты доходности алгоритмов в автоматическом режиме работы на выделенную сумму — без учета подушки. Результаты в каждом конкретном
                случае могут отличаться.
              </p>
            </div>
          )}
        </div>
      </section>
      <Closing />
    </div>
  )
}
