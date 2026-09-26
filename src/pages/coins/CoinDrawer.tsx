import { useState } from 'react'
import { api } from '../../api'
import type { Direction } from '../../api/types'
import { ColumnChart } from '../../components/charts/ColumnChart'
import { DirBadge } from '../../components/ui/Badges'
import { CoinIcon } from '../../components/ui/CoinIcon'
import { Drawer } from '../../components/ui/Drawer'
import { ExchangeTiles } from '../../components/ui/ExchangeTiles'
import { Segmented } from '../../components/ui/Segmented'
import { ErrorState, Skeleton } from '../../components/ui/States'
import { Pct } from '../../components/ui/Value'
import { MONTHS_SHORT, ymParts, ymTitle } from '../../lib/dates'
import { fmtDuration, fmtNum, fmtPct } from '../../lib/format'
import { links } from '../../lib/links'
import { useAsync } from '../../lib/useAsync'

interface Props {
  symbol: string | null
  direction: Direction
  onClose: () => void
}

/** Карточка монеты — по мотивам окна монеты в скринере «Портфель». */
export function CoinDrawer({ symbol, direction, onClose }: Props) {
  const [dir, setDir] = useState<Direction>(direction)
  const q = useAsync(() => (symbol ? api.coin(symbol) : Promise.resolve(null)), [symbol])
  const c = q.data
  const st = c ? (dir === 'LONG' ? c.long : c.short) : null
  const months = c ? c.months.slice(-12) : []

  return (
    <Drawer
      open={!!symbol}
      onClose={onClose}
      label={symbol ? `Монета ${symbol}` : 'Монета'}
      title={
        symbol && (
          <div className="coin-drawer-title">
            <CoinIcon symbol={symbol} size="lg" />
            <div>
              <strong>{symbol}</strong>
              <span className="pub-caption">
                {c ? (
                  <>
                    {c.name} · в портфеле №{c.rank} · Топ-{c.tier}
                  </>
                ) : (
                  'Загружаем…'
                )}
              </span>
            </div>
          </div>
        )
      }
      footer={
        symbol && (
          <>
            <a className="pub-btn" href={links.tradingView(symbol)} target="_blank" rel="noopener noreferrer">
              График в TradingView <span aria-hidden="true">↗</span>
            </a>
            <a className="pub-btn pub-primary" href={links.register}>
              Создать бота <span className="pub-arrow" aria-hidden="true">↗</span>
            </a>
          </>
        )
      }
    >
      {q.error && !c ? (
        <ErrorState onRetry={q.reload} />
      ) : !c || !st ? (
        <>
          <Skeleton h={44} />
          <div style={{ height: 14 }} />
          <Skeleton h={220} />
          <div style={{ height: 14 }} />
          <Skeleton h={240} />
        </>
      ) : (
        <div className="coin-drawer">
          <div className="coin-drawer-bar">
            <Segmented
              label="Направление"
              size="sm"
              value={dir}
              onChange={setDir}
              options={[
                { value: 'LONG', label: 'LONG' },
                { value: 'SHORT', label: 'SHORT' },
              ]}
            />
            <ExchangeTiles list={c.exchanges} />
          </div>

          <div className="coin-drawer-kpis">
            <div>
              <span>Итог за 12 месяцев</span>
              <strong className={`num ${st.returnPct12m >= 0 ? 'up' : 'down'}`}>{fmtPct(st.returnPct12m)}</strong>
            </div>
            <div>
              <span>Средний месяц</span>
              <strong className={`num ${st.avgMonthPct >= 0 ? 'up' : 'down'}`}>{fmtPct(st.avgMonthPct)}</strong>
            </div>
            <div>
              <span>Сделок за 12 мес.</span>
              <strong className="num">{fmtNum(st.trades12m)}</strong>
            </div>
          </div>

          <div className="metrics-heading">
            DCA · Manual <DirBadge dir={dir} /> и спот по месяцам
          </div>
          <ColumnChart
            height={210}
            vLabel={`DCA · Manual ${dir}`}
            v2Label={`${symbol} на споте`}
            ariaLabel={`Результат алгоритма и изменение цены ${symbol} по месяцам`}
            data={months.map((m) => {
              const { month0, year } = ymParts(m.ym)
              return {
                key: m.ym,
                label: MONTHS_SHORT[month0],
                full: `${ymTitle(m.ym)}${m.ym === c.months[c.months.length - 1].ym ? ' · месяц идет' : ''}`,
                v: dir === 'LONG' ? m.long : m.short,
                v2: m.spot,
                meta: `${fmtNum(dir === 'LONG' ? m.tradesLong : m.tradesShort)} сделок · ${year}`,
              }
            })}
          />
          <div className="pub-legend" style={{ marginTop: 6 }}>
            <span>
              <i className="sq" style={{ background: '#34d399' }} />
              Алгоритм, % к выделенной сумме
            </span>
            <span>
              <i className="sq" style={{ background: 'rgba(139,155,184,.6)' }} />
              Цена на споте
            </span>
          </div>

          <div className="metrics-heading">Показатели · 12 месяцев</div>
          <div className="metric-row">
            <span>Доля прибыльных</span>
            <b className="num">{fmtNum(st.winRate, 1)}%</b>
          </div>
          <div className="metric-row">
            <span>Среднее время сделки</span>
            <b className="num">{fmtDuration(st.avgDurationSec)}</b>
          </div>
          <div className="metric-row">
            <span>Просадка позиции, худшие 10%</span>
            <b className="num down">{fmtPct(st.drawdownP90Pct, 1)}</b>
          </div>
          <div className="metric-row">
            <span>Лучший месяц</span>
            <b className="num">
              {ymTitle(st.bestMonth.ym)} · <Pct v={st.bestMonth.pct} />
            </b>
          </div>
          <div className="metric-row">
            <span>Худший месяц</span>
            <b className="num">
              {ymTitle(st.worstMonth.ym)} · <Pct v={st.worstMonth.pct} />
            </b>
          </div>

          <div className="metrics-heading">По месяцам</div>
          <div className="coin-months">
            {[...months].reverse().map((m) => {
              const v = dir === 'LONG' ? m.long : m.short
              return (
                <div key={m.ym} className="coin-month">
                  <span>{ymTitle(m.ym)}</span>
                  <span className="mut num">{fmtNum(dir === 'LONG' ? m.tradesLong : m.tradesShort)} сд.</span>
                  <span className="mut">
                    спот <Pct v={m.spot} digits={1} />
                  </span>
                  <Pct v={v} />
                </div>
              )
            })}
          </div>
          <p className="pub-note" style={{ marginTop: 14 }}>
            Средний результат всех ботов DCA · Manual на {symbol}, % к выделенной сумме. Ваш результат зависит от суммы, плеча и момента входа.
          </p>
        </div>
      )}
    </Drawer>
  )
}
