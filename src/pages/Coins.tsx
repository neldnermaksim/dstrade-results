import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Search } from 'lucide-react'
import { api } from '../api'
import type { CoinStat, Direction, MatrixRow, PeriodKey, TierKey } from '../api/types'
import { HeatTable } from '../components/charts/HeatTable'
import { Sparkline } from '../components/charts/Sparkline'
import { CoinIcon } from '../components/ui/CoinIcon'
import { ExchangeTiles } from '../components/ui/ExchangeTiles'
import { Hint } from '../components/ui/Hint'
import { Segmented } from '../components/ui/Segmented'
import { Select, type SelectOption } from '../components/ui/Select'
import { Empty, ErrorState, Skeleton, Updating } from '../components/ui/States'
import { Pct } from '../components/ui/Value'
import { TIERS, periodLong } from '../content/dictionary'
import { currentYM } from '../lib/clock'
import { addMonthsYM, ymTitle } from '../lib/dates'
import { fmtDuration, fmtNum, fmtPct } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { CoinDrawer } from './coins/CoinDrawer'
import { TopCard } from './overview/TopCoinsSection'
import { Closing } from './overview/Closing'

type SortKey = 'rank' | 'trades' | 'returnPct' | 'winRate' | 'avgDurationSec' | 'drawdownP90Pct' | 'spotPct'
type View = 'table' | 'months'

const COLS: { key: SortKey; label: string; hint?: string }[] = [
  { key: 'trades', label: 'Сделок' },
  { key: 'returnPct', label: 'Прибыль, %', hint: 'Средний результат ботов DCA · Manual на монете за период, % к выделенной сумме.' },
  { key: 'winRate', label: 'Прибыльных' },
  { key: 'avgDurationSec', label: 'Ср. время' },
  { key: 'drawdownP90Pct', label: 'Просадка', hint: 'Насколько цена уходила против позиции до закрытия в худших 10% сделок.' },
  { key: 'spotPct', label: 'Спот', hint: 'Изменение цены монеты на споте за тот же период.' },
]

export default function Coins() {
  useDocumentTitle('Монеты')
  const [params, setParams] = useSearchParams()
  const tier = (Number(params.get('tier')) || 30) as TierKey
  const direction: Direction = params.get('dir') === 'SHORT' ? 'SHORT' : 'LONG'
  const range = params.get('m') ?? currentYM
  const view: View = params.get('view') === 'months' ? 'months' : 'table'
  const coin = params.get('coin')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'rank', desc: false })
  const thisYear = Number(currentYM.slice(0, 4))
  const [year, setYear] = useState(thisYear)

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) v == null ? next.delete(k) : next.set(k, v)
    setParams(next, { replace: true })
  }

  const isPeriod = range.endsWith('d')
  const ym = isPeriod ? null : range
  const coins = useAsync(
    () => api.coins(isPeriod ? { period: range as PeriodKey, tier, direction } : { ym: range, tier, direction }),
    [range, tier, direction],
  )
  const top = useAsync(() => (ym ? api.top3(ym) : Promise.resolve(null)), [ym])
  const heat = useAsync(() => (view === 'months' ? api.monthly(year, 'coins', direction, tier) : Promise.resolve(null)), [view, year, direction, tier])

  const rangeOptions = useMemo(() => {
    const opts: SelectOption<string>[] = [
      { value: '30d', label: 'Последние 30 дней', group: 'Период' },
      { value: '90d', label: 'Последние 90 дней', group: 'Период' },
      { value: '365d', label: 'Последние 12 месяцев', group: 'Период' },
    ]
    for (let i = 0; i < 21; i++) {
      const m = addMonthsYM(currentYM, -i)
      if (m < '2025-01') break
      opts.push({ value: m, label: ymTitle(m), meta: i === 0 ? 'идет' : undefined, group: 'Месяц' })
    }
    return opts
  }, [])

  const rows = useMemo(() => {
    const list = (coins.data ?? []).filter((c) => !search || c.symbol.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()))
    const k = sort.key
    return [...list].sort((a, b) => ((a[k] as number) - (b[k] as number)) * (sort.desc ? -1 : 1))
  }, [coins.data, search, sort])

  const avg = coins.data?.length ? coins.data.reduce((a, c) => a + c.returnPct, 0) / coins.data.length : null
  const spotAvg = coins.data?.length ? coins.data.reduce((a, c) => a + c.spotPct, 0) / coins.data.length : null
  const trades = coins.data?.reduce((a, c) => a + c.trades, 0) ?? 0
  const best = coins.data?.reduce<CoinStat | null>((a, c) => (!a || c.returnPct > a.returnPct ? c : a), null)
  const rangeLabel = isPeriod ? periodLong(range as PeriodKey) : `за ${ymTitle(range).toLowerCase()}`

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== 'rank' && key !== 'avgDurationSec' }))

  const heatLabel = (r: MatrixRow) => (
    <span className="coin">
      <CoinIcon symbol={r.symbol ?? r.key} />
      <span className="coin-sym">{r.label}</span>
    </span>
  )

  return (
    <div className="view-enter">
      <header className="pub-page-head">
        <div className="pub-wrap">
          <div className="pub-eyebrow">Результаты / Монеты</div>
          <div className="pub-page-head-grid">
            <h1>
              Монеты.
              <br />
              <span>Портфель скринера.</span>
            </h1>
            <p>
              Как алгоритм отработал на каждой монете портфеля: тот же состав, что во вкладке «Портфель» скринера — Топ-10, 20 и 30 по капитализации. Помогает выбрать
              монеты для ручного создания портфеля из алгоритмов.
            </p>
          </div>
        </div>
      </header>

      <section className="pub-section pub-tight">
        <div className="pub-wrap coins-layout">
          <aside className="coins-aside">
            <div className="aside-title">Состав портфеля</div>
            <div className="tier-list" role="group" aria-label="Состав портфеля">
              {TIERS.map((t) => (
                <button key={t.key} type="button" className={`tier-item ${tier === t.key ? 'on' : ''}`} aria-pressed={tier === t.key} onClick={() => set({ tier: t.key === 30 ? null : String(t.key) })}>
                  <b>{t.label}</b>
                  <span>{t.note}</span>
                </button>
              ))}
            </div>
            <div className="pub-panel pad aside-summary">
              <span className="pub-caption">Прибыль портфеля, % {rangeLabel}</span>
              <strong className={`num ${avg != null && avg < 0 ? 'down' : 'up'}`}>{avg == null ? '—' : fmtPct(avg)}</strong>
              <div className="metric-row">
                <span>Индекс спота</span>
                <b>
                  <Pct v={spotAvg} digits={1} />
                </b>
              </div>
              <div className="metric-row">
                <span>Сделок</span>
                <b className="num">{fmtNum(trades)}</b>
              </div>
              <div className="metric-row">
                <span>Лучшая монета</span>
                <b>{best ? `${best.symbol} ${fmtPct(best.returnPct, 1)}` : '—'}</b>
              </div>
              <p className="pub-note" style={{ marginTop: 10 }}>
                DCA · Manual {direction}, среднее по монетам Топ-{tier}.
              </p>
            </div>
          </aside>

          <div className="coins-main">
            <div className="pub-toolbar coins-toolbar">
              <div className="pub-toolbar-group">
                <Segmented
                  label="Направление"
                  value={direction}
                  onChange={(v) => set({ dir: v === 'LONG' ? null : v })}
                  size="sm"
                  options={[
                    { value: 'LONG', label: 'LONG' },
                    { value: 'SHORT', label: 'SHORT' },
                  ]}
                />
                {view === 'table' ? (
                  <Select label="Период" value={range} onChange={(v) => set({ m: v === currentYM ? null : v })} options={rangeOptions} minWidth={210} />
                ) : (
                  <Segmented
                    label="Год"
                    size="sm"
                    value={year}
                    onChange={setYear}
                    options={Array.from({ length: thisYear - 2024 }, (_, i) => 2025 + i).map((y) => ({ value: y, label: String(y) }))}
                  />
                )}
              </div>
              <div className="pub-toolbar-group">
                {view === 'table' && (
                  <label className="pub-search">
                    <Search size={15} aria-hidden="true" />
                    <span className="sr-only">Поиск монеты</span>
                    <input type="search" placeholder="Найти монету…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </label>
                )}
                <Segmented
                  label="Вид"
                  size="sm"
                  value={view}
                  onChange={(v) => set({ view: v === 'table' ? null : v })}
                  options={[
                    { value: 'table', label: 'Таблица' },
                    { value: 'months', label: 'По месяцам' },
                  ]}
                />
              </div>
            </div>

            {view === 'table' && ym && (
              <div className="coins-top">
                <div className="coins-top-title">
                  <span className="pub-caption">Топ-3 по прибыли {rangeLabel} · среди всех монет, где работали боты</span>
                </div>
                <div className="coins-top-cards">
                  {top.data ? top.data.map((c, i) => <TopCard key={c.symbol} c={c} place={i + 1} />) : [0, 1, 2].map((i) => <Skeleton key={i} h={150} r={16} />)}
                </div>
              </div>
            )}

            {view === 'table' ? (
              <div className="pub-panel coins-table-panel">
                <div className="coins-table-head">
                  <span className="pub-caption">
                    {rows.length} из {coins.data?.length ?? tier} монет · DCA · Manual {direction} · {rangeLabel}
                  </span>
                  <Updating on={coins.refreshing} />
                </div>
                {coins.error && !coins.data ? (
                  <ErrorState onRetry={coins.reload} />
                ) : !coins.data ? (
                  <div style={{ padding: 16 }}>
                    <Skeleton h={560} />
                  </div>
                ) : rows.length === 0 ? (
                  <Empty text="Монеты не найдены. Попробуйте другой запрос." />
                ) : (
                  <div className={`pub-table-wrap ${coins.refreshing ? 'is-refreshing' : ''}`}>
                    <table className="pub-table coins-table">
                      <thead>
                        <tr>
                          <th className={`sortable ${sort.key === 'rank' ? 'on' : ''}`} aria-sort={sort.key === 'rank' ? (sort.desc ? 'descending' : 'ascending') : 'none'}>
                            <button type="button" onClick={() => toggleSort('rank')} title="Место по капитализации в составе портфеля">
                              # {sort.key === 'rank' && (sort.desc ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}
                            </button>
                          </th>
                          <th>Монета</th>
                          <th>Биржи</th>
                          {COLS.map((c) => (
                            <th key={c.key} className={`r sortable ${sort.key === c.key ? 'on' : ''}`} aria-sort={sort.key === c.key ? (sort.desc ? 'descending' : 'ascending') : 'none'}>
                              <span className="th-hint">
                                <button type="button" onClick={() => toggleSort(c.key)}>
                                  {c.label}
                                  {sort.key === c.key && (sort.desc ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}
                                </button>
                                {c.hint && <Hint>{c.hint}</Hint>}
                              </span>
                            </th>
                          ))}
                          <th className="r">12 мес.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((c) => (
                          <tr
                            key={c.symbol}
                            className="clickable"
                            tabIndex={0}
                            aria-label={`${c.symbol}: ${fmtPct(c.returnPct)}. Открыть подробности`}
                            onClick={() => set({ coin: c.symbol })}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), set({ coin: c.symbol }))}
                          >
                            <td className="rank">{c.rank}</td>
                            <td>
                              <span className="coin">
                                <CoinIcon symbol={c.symbol} />
                                <span>
                                  <span className="coin-sym">{c.symbol}</span>
                                  <span className="coin-name" style={{ display: 'block' }}>
                                    {c.name}
                                  </span>
                                </span>
                              </span>
                            </td>
                            <td>
                              <ExchangeTiles list={c.exchanges} />
                            </td>
                            <td className="r num">{fmtNum(c.trades)}</td>
                            <td className="r">
                              <Pct v={c.returnPct} className="strong" />
                            </td>
                            <td className="r num">{fmtNum(c.winRate, 1)}%</td>
                            <td className="r num">{fmtDuration(c.avgDurationSec)}</td>
                            <td className="r">
                              <Pct v={c.drawdownP90Pct} digits={1} />
                            </td>
                            <td className="r">
                              <Pct v={c.spotPct} digits={1} />
                            </td>
                            <td className="r">
                              <Sparkline values={c.spark} width={76} height={22} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="pub-panel pad heat-panel">
                {heat.error && !heat.data ? (
                  <ErrorState onRetry={heat.reload} />
                ) : !heat.data ? (
                  <Skeleton h={560} />
                ) : (
                  <div className={heat.refreshing ? 'is-refreshing' : ''}>
                    <HeatTable matrix={heat.data} rowLabel={heatLabel} firstCol={`Монета топ-${tier}`} currentYM={currentYM} onPickRow={(r) => r.symbol && set({ coin: r.symbol })} />
                  </div>
                )}
              </div>
            )}
            <p className="pub-note" style={{ marginTop: 14 }}>
              Проценты — средний результат ботов на выделенную сумму, без учета подушки. Биржи — где монета торгуется бессрочным контрактом. Нажмите на строку, чтобы
              открыть карточку монеты.
            </p>
          </div>
        </div>
      </section>

      <CoinDrawer key={`${coin}-${direction}`} symbol={coin} direction={direction} onClose={() => set({ coin: null })} />

      <Closing
        title={
          <>
            Нашли свою монету?
            <br />
            <span className="pub-grad">Создайте бота.</span>
          </>
        }
      />
    </div>
  )
}
