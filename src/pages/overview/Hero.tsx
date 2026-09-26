import { useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { api, DATA_SOURCE } from '../../api'
import type { PeriodKey } from '../../api/types'
import { AreaChart } from '../../components/charts/AreaChart'
import { BrandLogo } from '../../components/layout/BrandLogo'
import { PeriodSwitch } from '../../components/ui/PeriodSwitch'
import { Skeleton } from '../../components/ui/States'
import { periodLong } from '../../content/dictionary'
import { fmtDateTime } from '../../lib/dates'
import { fmtCompact, fmtNum, fmtPct, fmtUsd } from '../../lib/format'
import { links } from '../../lib/links'
import { useMotion } from '../../lib/motion'
import { useAsync } from '../../lib/useAsync'

export function Hero() {
  const [period, setPeriod] = useState<PeriodKey>('30d')
  const summary = useAsync(() => api.summary(period), [period])
  const equity = useAsync(() => api.equity(period), [period])
  const { paused, toggle } = useMotion()
  const s = summary.data
  const busy = summary.refreshing || equity.refreshing

  return (
    <section className="pub-hero" aria-labelledby="hero-title">
      <div className="pub-wrap">
        <div className="pub-hero-copy">
          <div className="pub-eyebrow">DSTrade / Результаты алгоритмов</div>
          <h1 id="hero-title">
            Алгоритмы.
            <br />
            <span>В цифрах.</span>
          </h1>
          <p className="pub-hero-sub">
            Сводная статистика всех реальных счетов платформы: доходность стратегий, монет и режимов — по дням, неделям и месяцам.
          </p>
          <div className="pub-hero-actions">
            <a className="pub-btn pub-primary" href={links.register}>
              Создать аккаунт <span className="pub-arrow" aria-hidden="true">↗</span>
            </a>
            <a className="pub-btn" href="#how">
              Как считаем <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className="pub-hero-visual">
          <div className={`index-window ${busy ? 'is-busy' : ''}`}>
            <div className="index-chrome">
              <div className="index-chrome-brand">
                <BrandLogo className="pub-brand-lockup index-logo" />
                <span className="pub-caption">/ Индекс</span>
              </div>
              <span className="pub-caption index-updated">
                Все реальные счета · {s ? `расчет ${fmtDateTime(s.updatedAt)}` : 'загружаем…'}
                {DATA_SOURCE === 'mock' && <span className="sample-tag">демо-данные</span>}
              </span>
              <PeriodSwitch value={period} onChange={setPeriod} size="xs" />
            </div>

            <div className="index-head">
              <div>
                <div className="index-title">
                  <strong>Индекс DSTrade</strong>
                  <span className="pub-pill acc">{periodLong(period)}</span>
                </div>
                <div className="pub-caption">Средний результат ботов на выделенную сумму, все стратегии</div>
              </div>
              <div className="index-quote">
                {s ? (
                  <>
                    <strong className={`num ${s.returnPct >= 0 ? 'up' : 'down'}`}>{fmtPct(s.returnPct)}</strong>
                    <span className="pub-caption">
                      BTC на споте: <span className={s.benchmarkPct >= 0 ? 'up' : 'down'}>{fmtPct(s.benchmarkPct)}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <Skeleton h={30} w={130} r={8} />
                    <Skeleton h={12} w={110} r={6} />
                  </>
                )}
              </div>
            </div>

            <div className="index-chart">
              <div className="chart-ambience" aria-hidden="true" />
              {equity.data ? (
                <AreaChart data={equity.data} height={250} bench axis="right" sweep ariaLabel={`Накопленный результат индекса DSTrade ${periodLong(period)} в сравнении с BTC`} />
              ) : (
                <Skeleton h={250} />
              )}
            </div>

            <div className="index-key">
              <span>
                <i />
                Индекс DSTrade
              </span>
              <span>
                <i className="dash" />
                BTC на споте
              </span>
              <span className="pub-caption index-key-note">Наведите на график, чтобы увидеть день</span>
            </div>

            <div className="index-metrics">
              <div>
                <span>Итог пользователей</span>
                <strong className="num up">{s ? fmtUsd(s.profitUsd, 0) : '—'}</strong>
                <small>после комиссий и фандинга</small>
              </div>
              <div>
                <span>Сделок закрыто</span>
                <strong className="num">{s ? fmtNum(s.trades) : '—'}</strong>
                <small>{s ? `в среднем ${fmtNum(s.tradesPerDay, 0)} в день` : ' '}</small>
              </div>
              <div>
                <span>Доля прибыльных</span>
                <strong className="num">{s ? `${fmtNum(s.winRate, 1)}%` : '—'}</strong>
                <small>{s ? `${fmtNum(s.losses)} в минус` : ' '}</small>
              </div>
              <div>
                <span>Активных ботов</span>
                <strong className="num">{s ? fmtNum(s.activeBots) : '—'}</strong>
                <small>{s ? `оборот ${fmtCompact(s.volumeUsd)} $` : ' '}</small>
              </div>
            </div>
          </div>
        </div>

        <div className="pub-hero-bottom">
          <div className="pub-trust">
            <span>Только реальные счета</span>
            <span>Комиссии и фандинг учтены</span>
            <span>Убыточные сделки не скрываем</span>
          </div>
          <button type="button" className="pub-motion-toggle" onClick={toggle} aria-pressed={paused}>
            {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
            {paused ? 'Включить анимацию' : 'Пауза анимации'}
          </button>
        </div>
      </div>
    </section>
  )
}
