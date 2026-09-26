import { Link, useNavigate } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { api } from '../../api'
import type { TopCoin } from '../../api/types'
import { Sparkline } from '../../components/charts/Sparkline'
import { StageBadge, StrategyLetter, DirBadge } from '../../components/ui/Badges'
import { CoinIcon } from '../../components/ui/CoinIcon'
import { Section } from '../../components/ui/Section'
import { ErrorState, Skeleton } from '../../components/ui/States'
import { Pct } from '../../components/ui/Value'
import { currentYM } from '../../lib/clock'
import { MONTHS_GEN, ymParts } from '../../lib/dates'
import { fmtNum, fmtPct, plural } from '../../lib/format'
import { useAsync } from '../../lib/useAsync'
import { TIERS } from '../../content/dictionary'

export function TopCard({ c, place }: { c: TopCoin; place: number }) {
  return (
    <article className={`top-card pub-hover place-${place}`}>
      <div className="top-card-head">
        <span className="top-place">
          {place === 1 && <Trophy size={13} aria-hidden="true" />}№{place}
        </span>
        <span className="top-tags">
          <StrategyLetter auto={c.strategy === 'auto'} />
          <DirBadge dir={c.direction} />
          {c.stage && <StageBadge stage={c.stage} />}
        </span>
      </div>
      <div className="top-coin">
        <CoinIcon symbol={c.symbol} size="lg" />
        <div>
          <strong>{c.symbol}</strong>
          <span className="coin-name">{c.name}</span>
        </div>
      </div>
      <div className="top-value">
        <strong className={`num ${c.returnPct >= 0 ? 'up' : 'down'}`}>{fmtPct(c.returnPct)}</strong>
        <span className="pub-caption">
          {fmtNum(c.trades)} {plural(c.trades, 'сделка', 'сделки', 'сделок')} за месяц
        </span>
      </div>
    </article>
  )
}

export function TopCoinsSection() {
  const ym = currentYM
  const navigate = useNavigate()
  const top = useAsync(() => api.top3(ym), [ym])
  const coins = useAsync(() => api.coins({ ym, tier: 30, direction: 'LONG' }), [ym])
  const { month0, year } = ymParts(ym)
  const tierAvg = (n: number) => (coins.data ? coins.data.slice(0, n).reduce((a, c) => a + c.returnPct, 0) / Math.min(n, coins.data.length) : null)
  const avg = tierAvg(10)
  const tiers = TIERS.map((t) => ({ ...t, v: tierAvg(t.key) }))
  const tierMax = Math.max(...tiers.map((t) => Math.abs(t.v ?? 0)), 0.01)

  return (
    <Section
      id="top"
      eyebrow="05 / Топ-монеты"
      title={
        <>
          Лидеры
          <br />
          <span className="pub-accent">{MONTHS_GEN[month0]}.</span>
        </>
      }
      text={`Лучшие монеты ${MONTHS_GEN[month0]} ${year} среди всех, где работали боты, и результат портфеля Топ-10 — того же состава, что в скринере «Портфель».`}
    >
      {top.error && !top.data ? (
        <ErrorState onRetry={top.reload} />
      ) : (
        <div className="top-layout">
          <div className="top-cards">
            {top.data ? top.data.map((c, i) => <TopCard key={c.symbol} c={c} place={i + 1} />) : [0, 1, 2].map((i) => <Skeleton key={i} h={150} r={16} />)}
            <div className="pub-panel pad tier-panel">
              <div className="pub-panel-h">
                <h3>Прибыль портфеля, % за месяц</h3>
                <span className="pub-caption">DCA · Manual LONG</span>
              </div>
              {tiers.map((t) => (
                <div key={t.key} className="tier-row">
                  <div>
                    <b>{t.label}</b>
                    <span className="pub-caption">{t.note}</span>
                  </div>
                  <span className="tier-bar" aria-hidden="true">
                    <i style={{ width: `${((Math.abs(t.v ?? 0)) / tierMax) * 100}%` }} />
                  </span>
                  <Pct v={t.v} />
                </div>
              ))}
              <p className="pub-note" style={{ marginTop: 10 }}>
                Среднее по всем монетам состава — как строка «Прибыль портфеля» в ежемесячной таблице доходности.
              </p>
            </div>
          </div>
          <div className="pub-panel pad top-table">
            <div className="pub-panel-h">
              <h3>Портфель Топ-10 · DCA · Manual LONG</h3>
              {avg != null && (
                <span className="top-avg">
                  Прибыль портфеля <Pct v={avg} />
                </span>
              )}
            </div>
            {!coins.data ? (
              <Skeleton h={380} />
            ) : (
              <div className="pub-table-wrap">
                <table className="pub-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Монета</th>
                      <th className="r">Сделок</th>
                      <th className="r">Прибыль за месяц</th>
                      <th className="r">Спот</th>
                      <th className="r">12 мес.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coins.data.slice(0, 10).map((c) => (
                      <tr key={c.symbol} className="clickable" onClick={() => navigate(`/coins?coin=${c.symbol}`)}>
                        <td className="rank">{c.rank}</td>
                        <td>
                          <span className="coin">
                            <CoinIcon symbol={c.symbol} />
                            <span className="coin-sym">{c.symbol}</span>
                          </span>
                        </td>
                        <td className="r num">{fmtNum(c.trades)}</td>
                        <td className="r">
                          <Pct v={c.returnPct} />
                        </td>
                        <td className="r">
                          <Pct v={c.spotPct} digits={1} />
                        </td>
                        <td className="r">
                          <Sparkline values={c.spark} width={72} height={22} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="pub-panel-foot top-foot">
              <span>Месяц еще идет — значения растут вместе с ним.</span>
              <Link className="pub-link" to="/coins">
                Все монеты портфеля <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </Section>
  )
}
