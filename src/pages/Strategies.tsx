import { useState, type ReactElement } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Layers, ListChecks, Radar, Target } from 'lucide-react'
import { api } from '../api'
import type { Direction, MatrixRow, PeriodKey, StrategyKey } from '../api/types'
import { AreaChart } from '../components/charts/AreaChart'
import { Bars } from '../components/charts/Bars'
import { ColumnChart } from '../components/charts/ColumnChart'
import { HeatTable } from '../components/charts/HeatTable'
import { Sparkline } from '../components/charts/Sparkline'
import { CloseReasonsBar } from '../components/charts/StackBar'
import { DirBadge, PlusBadge, RiskBadge, StageBadge } from '../components/ui/Badges'
import { CoinIcon } from '../components/ui/CoinIcon'
import { ExchangeIcon } from '../components/ui/ExchangeTiles'
import { Hint } from '../components/ui/Hint'
import { Kpi, KpiSkeleton } from '../components/ui/Kpi'
import { PeriodSwitch } from '../components/ui/PeriodSwitch'
import { Segmented } from '../components/ui/Segmented'
import { ErrorState, Skeleton, Updating } from '../components/ui/States'
import { Pct } from '../components/ui/Value'
import { EXCHANGES, EXIT_MODES, STAGES, STRATEGIES, periodLong } from '../content/dictionary'
import { currentYM } from '../lib/clock'
import { fmtDuration, fmtNum, fmtPct } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { Closing } from './overview/Closing'

const STEPS: Record<StrategyKey, { icon: ReactElement; t: string; d: string }[]> = {
  manual: [
    { icon: <Target size={16} />, t: 'Вы выбираете монету', d: 'Из портфеля скринера или любую доступную на бирже. Направление — LONG или SHORT, сумма и плечо — ваши.' },
    { icon: <Layers size={16} />, t: 'Бот усредняет по весам', d: 'Вход весом 0, затем докупки по сетке, если цена идет против позиции. Средняя цена входа подтягивается к рынку.' },
    { icon: <ListChecks size={16} />, t: 'Закрывает по сигналу', d: 'Корзина закрывается целиком по сигналу закрытия. Насколько рано — задает режим закрытия.' },
  ],
  auto: [
    { icon: <Radar size={16} />, t: 'Скринер находит монету', d: 'Оценивает сотни монет и выделяет стадии: PUMP, RUN, FLIP, DUMP и другие. Монету и направление бот берет сам.' },
    { icon: <Layers size={16} />, t: 'Бот входит по стадии', d: 'Только по стадиям, разрешенным в настройках. Дальше — тот же алгоритм усреднения по весам.' },
    { icon: <ListChecks size={16} />, t: 'Выходит и берет следующую', d: 'После закрытия корзины бот ждет новый сигнал. Одна монета — один бот на счете.' },
  ],
}

type DirFilter = Direction | 'ALL'

export default function Strategies() {
  useDocumentTitle('Стратегии')
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const strategy = (params.get('s') === 'auto' ? 'auto' : 'manual') as StrategyKey
  const dirParam = params.get('dir')
  const direction: DirFilter = strategy === 'auto' ? 'ALL' : dirParam === 'LONG' || dirParam === 'SHORT' ? dirParam : 'ALL'
  const pParam = params.get('p') as PeriodKey | null
  const period: PeriodKey = pParam && ['30d', '90d', '365d', 'all'].includes(pParam) ? pParam : '365d'
  const thisYear = Number(currentYM.slice(0, 4))
  const [year, setYear] = useState(thisYear)
  const [heatDir, setHeatDir] = useState<Direction>('LONG')

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) v == null ? next.delete(k) : next.set(k, v)
    setParams(next, { replace: true })
  }

  const q = useAsync(() => api.strategy(strategy, direction, period), [strategy, direction, period])
  const heatDirection: Direction = direction === 'ALL' ? heatDir : direction
  const heat = useAsync(
    () => (strategy === 'auto' ? api.monthly(year, 'stages') : api.monthly(year, 'coins', heatDirection, 30)),
    [strategy, year, heatDirection],
  )
  const d = q.data
  const seg = d?.segment

  const bestExit = d ? d.exitModes.reduce((a, m) => (m.avgTradePct > a.avgTradePct ? m : a), d.exitModes[0]) : null
  const heatLabel = (r: MatrixRow) =>
    r.symbol ? (
      <span className="coin">
        <CoinIcon symbol={r.symbol} />
        <span className="coin-sym">{r.symbol}</span>
      </span>
    ) : r.stage ? (
      <span className="stage-cell">
        <StageBadge stage={r.stage} />
        <span className="pub-caption">{STAGES[r.stage].profile}</span>
      </span>
    ) : (
      r.label
    )

  return (
    <div className="view-enter">
      <header className="pub-page-head">
        <div className="pub-wrap">
          <div className="pub-eyebrow">Результаты / Стратегии</div>
          <div className="pub-page-head-grid">
            <h1>
              Стратегии.
              <br />
              <span>Под лупой.</span>
            </h1>
            <p>
              Как отработали DCA · Manual и DCA · Auto на реальных счетах: режимы закрытия, стадии скринера, глубина усреднений и причины закрытия сделок. Все в
              процентах к выделенной боту сумме.
            </p>
          </div>
        </div>
      </header>

      <div className="strat-toolbar">
        <div className="pub-wrap strat-toolbar-inner">
          <Segmented
            label="Стратегия"
            value={strategy}
            onChange={(v) => set({ s: v, dir: v === 'auto' ? null : params.get('dir') })}
            options={[
              { value: 'manual', label: 'DCA · Manual' },
              { value: 'auto', label: 'DCA · Auto' },
            ]}
          />
          {strategy === 'manual' && (
            <Segmented
              label="Направление"
              value={direction}
              onChange={(v) => set({ dir: v === 'ALL' ? null : v })}
              size="sm"
              options={[
                { value: 'ALL', label: 'Все' },
                { value: 'LONG', label: 'LONG' },
                { value: 'SHORT', label: 'SHORT' },
              ]}
            />
          )}
          <div className="strat-toolbar-end">
            <Updating on={q.refreshing} />
            <PeriodSwitch value={period} onChange={(p) => set({ p })} size="sm" only={['30d', '90d', '365d', 'all']} />
          </div>
        </div>
      </div>

      <section className="pub-section pub-tight">
        <div className="pub-wrap">
          {q.error && !d ? (
            <ErrorState onRetry={q.reload} />
          ) : !d || !seg ? (
            <>
              <Skeleton h={360} r={16} />
              <div style={{ marginTop: 14 }}>
                <KpiSkeleton n={6} />
              </div>
            </>
          ) : (
            <div className={q.refreshing ? 'is-refreshing' : ''}>
              <div className="pub-grid g-7-5">
                <div className="pub-panel pad glow">
                  <div className="pub-panel-h">
                    <h3>Результат за период</h3>
                    <span className="pub-caption">{periodLong(period)} · к выделенной сумме</span>
                  </div>
                  <div className="big-result">
                    <strong className={`num ${seg.returnPct >= 0 ? 'up' : 'down'}`}>{fmtPct(seg.returnPct)}</strong>
                    <span>
                      в среднем <Pct v={seg.avgMonthPct} /> в месяц
                    </span>
                  </div>
                  <AreaChart data={d.equity} height={230} bench valueLabel={STRATEGIES[strategy].name} ariaLabel="Накопленный результат стратегии в сравнении с BTC" />
                  <div className="pub-legend" style={{ marginTop: 8 }}>
                    <span>
                      <i />
                      {STRATEGIES[strategy].name}
                      {direction !== 'ALL' ? ` · ${direction}` : ''}
                    </span>
                    <span>
                      <i className="dash" />
                      BTC на споте
                    </span>
                  </div>
                </div>

                <div className="pub-panel pad strat-about">
                  <div className="strat-about-top">
                    <div className="strat-card-name">
                      <h3>{STRATEGIES[strategy].name}</h3>
                      <DirBadge dir={direction} />
                    </div>
                    <RiskBadge risk={seg.risk} />
                  </div>
                  <p className="pub-note">{STRATEGIES[strategy].note}</p>
                  {strategy === 'auto' && (
                    <p className="strat-card-warn">
                      <AlertTriangle size={14} aria-hidden="true" /> Внимание! Высокий уровень риска!
                    </p>
                  )}
                  <ol className="steps">
                    {STEPS[strategy].map((s, i) => (
                      <li key={s.t}>
                        <span className="steps-ic" aria-hidden="true">
                          {s.icon}
                        </span>
                        <div>
                          <b>
                            <span className="acc">0{i + 1}</span> {s.t}
                          </b>
                          <p>{s.d}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="strat-about-foot">
                    <div>
                      <span>Ботов в работе</span>
                      <b className="num">{fmtNum(seg.bots)}</b>
                    </div>
                    <div>
                      <span>Сделок {periodLong(period)}</span>
                      <b className="num">{fmtNum(seg.trades)}</b>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pub-kpis kpis-6" style={{ marginTop: 14 }}>
                <Kpi label="Средний месяц" value={fmtPct(seg.avgMonthPct)} tone={seg.avgMonthPct >= 0 ? 'up' : 'down'} sub="к выделенной сумме" />
                <Kpi label="Доля прибыльных" value={`${fmtNum(seg.winRate, 1)}%`} meter={seg.winRate} sub={`${fmtNum(Math.round((seg.trades * (100 - seg.winRate)) / 100))} сделок в минус`} />
                <Kpi label="Средняя сделка" value={fmtPct(seg.avgTradePct)} tone="up" sub="к выделенной сумме" />
                <Kpi label="Среднее время сделки" value={fmtDuration(seg.avgDurationSec)} sub="от входа до закрытия корзины" />
                <Kpi
                  label="Просадка позиции"
                  value={fmtPct(seg.drawdownP90Pct, 1)}
                  tone="down"
                  sub="худшие 10% сделок"
                  hint="Насколько цена уходила против позиции от первого входа до закрытия. 90-й перцентиль: в 9 из 10 сделок просадка была меньше."
                />
                <Kpi label="Ликвидации" value={`${fmtNum(seg.liqShare, 2)}%`} sub="доля закрытых сделок" hint="Сделки, которые биржа закрыла принудительно из-за нехватки маржи. Главный риск усреднения с плечом." />
              </div>
            </div>
          )}
        </div>
      </section>

      {d && seg && (
        <>
          <section className="pub-section" aria-labelledby="exit-title">
            <div className="pub-wrap">
              <div className="pub-eyebrow">01 / Режим закрытия</div>
              <div className="pub-section-top">
                <h2 id="exit-title">
                  Раньше или позже.
                  <br />
                  <span className="pub-accent">Выбор за вами.</span>
                </h2>
                <div className="pub-section-side">
                  <p>Режим закрытия задает, как долго бот держит позицию после сигнала. Сравнение — по сделкам {periodLong(period)}.</p>
                </div>
              </div>
              <div className="exit-grid">
                {d.exitModes.map((m) => {
                  const meta = EXIT_MODES[m.key]
                  const top = bestExit?.key === m.key
                  return (
                    <article key={m.key} className={`exit-card pub-hover ${top ? 'top' : ''} ${meta.plus ? 'plus' : ''}`}>
                      <div className="exit-head">
                        <span className={`exit-letter ${m.key}`} aria-hidden="true">
                          {meta.letter}
                        </span>
                        <h3>{meta.name}</h3>
                        {meta.plus && <PlusBadge />}
                      </div>
                      <p className="pub-note exit-desc">{meta.desc}</p>
                      <div className="exit-value">
                        <strong className="num up">{fmtPct(m.avgTradePct)}</strong>
                        <small>средняя сделка</small>
                      </div>
                      <div className="exit-tag">{top ? <span className="pub-pill acc">Больше профита на сделку</span> : null}</div>
                      <div className="metric-row">
                        <span>Доля сделок</span>
                        <b className="num">{fmtNum(m.share, 1)}%</b>
                      </div>
                      <div className="metric-row">
                        <span>Доля прибыльных</span>
                        <b className="num">{fmtNum(m.winRate, 1)}%</b>
                      </div>
                      <div className="metric-row">
                        <span>Среднее время</span>
                        <b className="num">{fmtDuration(m.avgDurationSec)}</b>
                      </div>
                      <div className="metric-row">
                        <span>Средний макс. вес</span>
                        <b className="num">{fmtNum(m.avgMaxWeight, 1)}</b>
                      </div>
                    </article>
                  )
                })}
              </div>
              <p className="pub-note" style={{ marginTop: 16 }}>
                Режим можно сменить и у уже открытой позиции. Overkill начинает поиск сигнала закрытия с третьей ступени весов закрытия — ожидание может увеличить время
                удержания позиции.
              </p>
            </div>
          </section>

          <section className="pub-section" aria-labelledby="detail-title">
            <div className="pub-wrap">
              <div className="pub-eyebrow">{strategy === 'auto' ? '02 / Стадии скринера' : '02 / Монеты'}</div>
              <div className="pub-section-top">
                <h2 id="detail-title">
                  {strategy === 'auto' ? (
                    <>
                      Какая стадия.
                      <br />
                      <span className="pub-accent">Какой риск.</span>
                    </>
                  ) : (
                    <>
                      Где алгоритм
                      <br />
                      <span className="pub-accent">заработал больше.</span>
                    </>
                  )}
                </h2>
                <div className="pub-section-side">
                  <p>
                    {strategy === 'auto'
                      ? 'DCA · Auto берет монеты по стадиям скринера. У каждой стадии свой характер: одни чаще доходят до глубоких весов, другие закрываются быстрее.'
                      : `Результат DCA · Manual по монетам портфеля ${periodLong(period)}. Нажмите на монету — откроется ее карточка.`}
                  </p>
                </div>
              </div>

              {strategy === 'auto' ? (
                <div className="pub-panel pad">
                  <div className="pub-table-wrap">
                    <table className="pub-table stage-table">
                      <thead>
                        <tr>
                          <th>Стадия</th>
                          <th>Напр.</th>
                          <th>Доля сделок</th>
                          <th className="r">Результат</th>
                          <th className="r">Ср. сделка</th>
                          <th className="r">Прибыльных</th>
                          <th className="r">
                            <span className="th-hint">
                              Вес 6+
                              <Hint>Доля сделок, которые дошли до веса 6 и глубже. Чем выше — тем чаще позиции уходят далеко против входа.</Hint>
                            </span>
                          </th>
                          <th className="r">
                            <span className="th-hint">
                              Ход от веса 0
                              <Hint>Насколько цена уходила против позиции от первого входа: медиана / худшие 10% сделок.</Hint>
                            </span>
                          </th>
                          <th className="r">В сделке</th>
                          <th className="r">12 мес.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.stages.map((s) => (
                          <tr key={s.key}>
                            <td>
                              <span className="stage-cell">
                                <StageBadge stage={s.key} />
                                <span>
                                  <b>{STAGES[s.key].profile}</b>
                                  <small>{STAGES[s.key].desc}</small>
                                </span>
                              </span>
                            </td>
                            <td>
                              <DirBadge dir={s.direction} />
                            </td>
                            <td>
                              <span className="share-cell">
                                <span className="tier-bar">
                                  <i style={{ width: `${s.share * 3}%` }} />
                                </span>
                                <span className="num">{fmtNum(s.share, 1)}%</span>
                              </span>
                            </td>
                            <td className="r">
                              <Pct v={s.returnPct} />
                            </td>
                            <td className="r">
                              <Pct v={s.avgTradePct} />
                            </td>
                            <td className="r num">{fmtNum(s.winRate, 1)}%</td>
                            <td className={`r num ${s.deepShare > 10 ? 'down' : s.deepShare > 5 ? 'warn' : 'up'}`}>{fmtNum(s.deepShare, 1)}%</td>
                            <td className="r num">
                              {fmtNum(s.maeMedPct, 0)}% <span className="mut">/ {fmtNum(s.maeP90Pct, 0)}%</span>
                            </td>
                            <td className="r num">~{fmtDuration(s.durMedSec)}</td>
                            <td className="r">
                              <Sparkline values={s.spark} width={72} height={22} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="pub-panel-foot">
                    Стадии WATCH и BOUNCE ботам не раздаются — это наблюдение и радар для ручной работы, поэтому в статистике их нет.
                  </p>
                </div>
              ) : (
                <div className="pub-grid g2">
                  <div className="pub-panel pad">
                    <div className="pub-panel-h">
                      <h3>Лучшие монеты</h3>
                      <span className="pub-caption">{periodLong(period)}</span>
                    </div>
                    <Bars
                      ariaLabel="Лучшие монеты"
                      onPick={(sym) => navigate(`/coins?coin=${sym}${direction !== 'ALL' ? `&dir=${direction}` : ''}`)}
                      items={d.coins.slice(0, 10).map((c) => ({
                        key: c.symbol,
                        label: (
                          <>
                            <CoinIcon symbol={c.symbol} /> {c.symbol}
                          </>
                        ),
                        value: c.returnPct,
                        display: fmtPct(c.returnPct),
                      }))}
                    />
                  </div>
                  <div className="pub-panel pad">
                    <div className="pub-panel-h">
                      <h3>Слабее всего</h3>
                      <span className="pub-caption">{periodLong(period)}</span>
                    </div>
                    <Bars
                      ariaLabel="Монеты с наименьшим результатом"
                      onPick={(sym) => navigate(`/coins?coin=${sym}${direction !== 'ALL' ? `&dir=${direction}` : ''}`)}
                      items={d.coins
                        .slice(-10)
                        .reverse()
                        .map((c) => ({
                          key: c.symbol,
                          label: (
                            <>
                              <CoinIcon symbol={c.symbol} /> {c.symbol}
                            </>
                          ),
                          value: c.returnPct,
                          display: fmtPct(c.returnPct),
                          tone: c.returnPct >= 0 ? ('acc' as const) : ('down' as const),
                        }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="pub-section" aria-labelledby="risk-title">
            <div className="pub-wrap">
              <div className="pub-eyebrow">03 / Как закрываются сделки</div>
              <div className="pub-section-top">
                <h2 id="risk-title">
                  Глубина и исход.
                  <br />
                  <span className="pub-accent">Без округлений.</span>
                </h2>
                <div className="pub-section-side">
                  <p>До какого веса доходят сделки, чем они заканчиваются и на каких биржах работают боты стратегии.</p>
                </div>
              </div>
              <div className="pub-grid g3 risk-grid">
                <div className="pub-panel pad">
                  <div className="pub-panel-h">
                    <h3>Глубина усреднений</h3>
                    <Hint>Вес — ступень докупки. Вес 0 — первый вход. Чем больше вес к закрытию, тем дальше цена уходила против позиции.</Hint>
                  </div>
                  <ColumnChart
                    data={d.weights.map((w) => ({ key: String(w.weight), label: String(w.weight), full: `Максимальный вес ${w.weight}`, v: w.share, meta: `средняя сделка ${fmtPct(w.avgTradePct)}` }))}
                    height={200}
                    vLabel="Доля сделок"
                    format={(v) => `${fmtNum(v, 1)}%`}
                    mono
                    ariaLabel="Распределение сделок по максимальному весу"
                  />
                  <p className="pub-panel-foot">
                    {fmtNum(d.weights.slice(0, 3).reduce((a, w) => a + w.share, 0), 0)}% сделок закрываются, не дойдя до веса 3.
                  </p>
                </div>
                <div className="pub-panel pad">
                  <div className="pub-panel-h">
                    <h3>Причины закрытия</h3>
                    <span className="pub-caption">{periodLong(period)}</span>
                  </div>
                  <CloseReasonsBar data={d.closeReasons} />
                </div>
                <div className="pub-panel pad">
                  <div className="pub-panel-h">
                    <h3>По биржам</h3>
                    <span className="pub-caption">доля сделок · результат</span>
                  </div>
                  <div className="ex-rows">
                    {d.exchanges.map((e) => (
                      <div key={e.key} className="ex-row">
                        <ExchangeIcon ex={e.key} />
                        <span className="ex-name">{EXCHANGES[e.key].name}</span>
                        <span className="tier-bar">
                          <i style={{ width: `${e.share}%` }} />
                        </span>
                        <span className="num mut">{fmtNum(e.share, 0)}%</span>
                        <Pct v={e.returnPct} />
                      </div>
                    ))}
                  </div>
                  <p className="pub-panel-foot">Результат на разных биржах близок: алгоритм один, различаются комиссии, фандинг и ликвидность.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="pub-section" aria-labelledby="months-title">
            <div className="pub-wrap">
              <div className="pub-eyebrow">04 / По месяцам</div>
              <div className="pub-section-top">
                <h2 id="months-title">
                  {strategy === 'auto' ? 'Стадии' : 'Монеты'} по месяцам.
                  <br />
                  <span className="pub-accent">{year}.</span>
                </h2>
                <div className="pub-section-side">
                  <p>
                    {strategy === 'auto'
                      ? 'Результат каждой стадии DCA · Auto по месяцам, % к выделенной сумме.'
                      : 'Результат DCA · Manual по всем 30 монетам портфеля — как годовой лист таблицы доходности.'}
                  </p>
                </div>
              </div>
              <div className="pub-toolbar">
                {strategy === 'manual' && direction === 'ALL' ? (
                  <Segmented
                    label="Направление таблицы"
                    size="sm"
                    value={heatDir}
                    onChange={setHeatDir}
                    options={[
                      { value: 'LONG', label: 'LONG' },
                      { value: 'SHORT', label: 'SHORT' },
                    ]}
                  />
                ) : (
                  <span />
                )}
                <div className="pub-toolbar-group">
                  <Updating on={heat.refreshing} />
                  <Segmented
                    label="Год"
                    size="sm"
                    value={year}
                    onChange={setYear}
                    options={Array.from({ length: thisYear - 2024 }, (_, i) => 2025 + i).map((y) => ({ value: y, label: String(y) }))}
                  />
                </div>
              </div>
              <div className="pub-panel pad heat-panel">
                {heat.error && !heat.data ? (
                  <ErrorState onRetry={heat.reload} />
                ) : !heat.data ? (
                  <Skeleton h={520} />
                ) : (
                  <div className={heat.refreshing ? 'is-refreshing' : ''}>
                    <HeatTable
                      matrix={heat.data}
                      rowLabel={heatLabel}
                      firstCol={strategy === 'auto' ? 'Стадия' : 'Монета'}
                      currentYM={currentYM}
                      onPickRow={strategy === 'manual' ? (r) => r.symbol && navigate(`/coins?coin=${r.symbol}&dir=${heatDirection}`) : undefined}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      <Closing
        title={
          <>
            Выбрали стратегию?
            <br />
            <span className="pub-grad">Запустите на демо.</span>
          </>
        }
      />
    </div>
  )
}
