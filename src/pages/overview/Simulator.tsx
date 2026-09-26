import { useMemo, useState } from 'react'
import { api } from '../../api'
import type { SegmentKey } from '../../api/types'
import { AreaChart } from '../../components/charts/AreaChart'
import { PlusBadge } from '../../components/ui/Badges'
import { Hint } from '../../components/ui/Hint'
import { Segmented } from '../../components/ui/Segmented'
import { Select } from '../../components/ui/Select'
import { Section } from '../../components/ui/Section'
import { ErrorState, Skeleton } from '../../components/ui/States'
import { MONTHS_GEN, ymParts, ymTitle } from '../../lib/dates'
import { fmtNum, fmtPct, fmtUsd, plural } from '../../lib/format'
import { links } from '../../lib/links'
import { useAsync } from '../../lib/useAsync'

type SimKey = SegmentKey | 'mix'

const WEIGHTS: Record<SegmentKey, number> = { manual_long: 0.46, manual_short: 0.24, auto: 0.3 }

export function Simulator() {
  const q = useAsync(() => api.series(), [])
  const [seg, setSeg] = useState<SimKey>('manual_long')
  const [amount, setAmount] = useState(1000)
  const [amountText, setAmountText] = useState('1000')
  const [start, setStart] = useState<string | null>(null)
  const [reinvest, setReinvest] = useState(false)
  const [plan, setPlan] = useState<'base' | 'plus'>('base')

  const months = q.data?.[0]?.months.map((m) => m.ym) ?? []
  const startYM = start ?? months[Math.max(0, months.length - 12)] ?? ''

  const res = useMemo(() => {
    if (!q.data || !startYM) return null
    const bySeg = Object.fromEntries(q.data.map((s) => [s.key, new Map(s.months.map((m) => [m.ym, m.pct]))])) as Record<SegmentKey, Map<string, number>>
    const fee = plan === 'base' ? 0.2 : 0.15
    const yms = months.filter((m) => m >= startYM)
    let bal = amount
    let profit = 0
    let feePaid = 0
    const pts: { t: string; v: number }[] = [{ t: `${startYM}-01`, v: 0 }]
    const monthly: { ym: string; net: number }[] = []
    for (const ym of yms) {
      const gross =
        seg === 'mix'
          ? (Object.keys(WEIGHTS) as SegmentKey[]).reduce((a, k) => a + (bySeg[k].get(ym) ?? 0) * WEIGHTS[k], 0)
          : (bySeg[seg].get(ym) ?? 0)
      const net = gross > 0 ? gross * (1 - fee) : gross
      feePaid += gross > 0 ? ((reinvest ? bal : amount) * (gross - net)) / 100 : 0
      if (reinvest) bal *= 1 + net / 100
      else profit += (amount * net) / 100
      monthly.push({ ym, net })
      const { year, month0 } = ymParts(ym)
      const last = new Date(year, month0 + 1, 0).getDate()
      pts.push({ t: `${ym}-${String(last).padStart(2, '0')}`, v: reinvest ? (bal / amount - 1) * 100 : (profit / amount) * 100 })
    }
    const result = reinvest ? bal - amount : profit
    const sorted = [...monthly].sort((a, b) => b.net - a.net)
    return { result, feePaid, final: amount + result, pct: (result / amount) * 100, pts, n: yms.length, best: sorted[0], worst: sorted[sorted.length - 1], neg: monthly.filter((m) => m.net < 0).length }
  }, [q.data, startYM, seg, amount, reinvest, plan, months])

  const commitAmount = (t: string) => {
    const v = Math.round(Number(t.replace(/\s/g, '').replace(',', '.')))
    const ok = Number.isFinite(v) ? Math.min(1_000_000, Math.max(100, v)) : amount
    setAmount(ok)
    setAmountText(String(ok))
  }

  const step = (d: number) => commitAmount(String(amount + d))

  return (
    <Section
      id="simulator"
      eyebrow="07 / Проверка на истории"
      title={
        <>
          Что было бы,
          <br />
          <span className="pub-accent">если бы вы начали.</span>
        </>
      }
      text="Выберите стратегию, сумму и месяц старта — посчитаем результат по фактической средней доходности ботов платформы с учетом комиссии за прибыльные сделки."
    >
      {q.error && !q.data ? (
        <ErrorState onRetry={q.reload} />
      ) : !q.data || !res ? (
        <Skeleton h={460} r={16} />
      ) : (
        <div className="sim">
          <div className="pub-panel pad sim-form">
            <div className="sim-field">
              <span className="sim-label">Стратегия</span>
              <Segmented
                label="Стратегия"
                size="sm"
                value={seg}
                onChange={setSeg}
                className="sim-seg"
                options={[
                  { value: 'manual_long', label: 'Manual LONG' },
                  { value: 'manual_short', label: 'Manual SHORT' },
                  { value: 'auto', label: 'Auto' },
                  { value: 'mix', label: 'Как у всех', title: 'Распределение как в среднем по платформе' },
                ]}
              />
            </div>
            <div className="sim-row">
              <div className="sim-field">
                <label className="sim-label" htmlFor="sim-amount">
                  Сумма боту, USDT
                </label>
                <span className="stepper">
                  <button type="button" onClick={() => step(-100)} aria-label="Уменьшить сумму на 100">
                    −
                  </button>
                  <input
                    id="sim-amount"
                    type="text"
                    inputMode="numeric"
                    value={amountText}
                    onChange={(e) => setAmountText(e.target.value.replace(/[^\d\s]/g, ''))}
                    onBlur={(e) => commitAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && commitAmount((e.target as HTMLInputElement).value)}
                  />
                  <button type="button" onClick={() => step(100)} aria-label="Увеличить сумму на 100">
                    +
                  </button>
                </span>
              </div>
              <div className="sim-field">
                <span className="sim-label">Старт</span>
                <Select
                  label="Месяц старта"
                  value={startYM}
                  onChange={setStart}
                  options={[...months].reverse().map((m) => ({ value: m, label: ymTitle(m), group: m.slice(0, 4) }))}
                  minWidth={180}
                />
              </div>
            </div>
            <div className="sim-field">
              <span className="sim-label">
                Комиссия платформы
                <Hint>Комиссия берется только с прибыльных сделок: 20% на базовых условиях или 15% с подпиской Plus. Стоимость подписки в расчет не входит.</Hint>
              </span>
              <Segmented
                label="Комиссия платформы"
                size="sm"
                value={plan}
                onChange={setPlan}
                options={[
                  { value: 'base', label: 'Базовые · 20%' },
                  {
                    value: 'plus',
                    label: (
                      <>
                        <PlusBadge /> 15%
                      </>
                    ),
                  },
                ]}
              />
            </div>
            <label className="pub-switch-row">
              <span>
                Реинвестировать прибыль
                <br />
                <small className="mut2">увеличивать сумму боту каждый месяц</small>
              </span>
              <button type="button" role="switch" className="switch" aria-checked={reinvest} aria-label="Реинвестировать прибыль" onClick={() => setReinvest((r) => !r)} />
            </label>
            <div className="sim-summary">
              <div className="metric-row">
                <span>Сумма на конец</span>
                <b className="num">{fmtNum(res.final, 0)} USDT</b>
              </div>
              <div className="metric-row">
                <span>Комиссия платформы</span>
                <b className="num">{fmtNum(res.feePaid, 0)} USDT</b>
              </div>
              <div className="metric-row">
                <span>Итог после комиссии</span>
                <b className={`num ${res.result >= 0 ? 'up' : 'down'}`}>{fmtUsd(res.result, 0)}</b>
              </div>
            </div>
          </div>

          <div className="pub-panel pad glow sim-result">
            <div className="sim-head">
              <div>
                <span className="pub-caption">
                  Результат за {res.n} {plural(res.n, 'месяц', 'месяца', 'месяцев')} · с {MONTHS_GEN[ymParts(startYM).month0]} {startYM.slice(0, 4)}
                </span>
                <strong className={`sim-big num ${res.result >= 0 ? 'up' : 'down'}`}>{fmtUsd(res.result, 0)}</strong>
                <span className="sim-sub">
                  <b className={`num ${res.pct >= 0 ? 'up' : 'down'}`}>{fmtPct(res.pct, 1)}</b> к сумме {fmtNum(amount)} USDT
                  {reinvest && ' · с реинвестированием'}
                </span>
              </div>
              <div className="sim-stats">
                <div>
                  <span>Лучший месяц</span>
                  <b className="num up">{res.best ? fmtPct(res.best.net, 1) : '—'}</b>
                </div>
                <div>
                  <span>Худший месяц</span>
                  <b className={`num ${res.worst && res.worst.net < 0 ? 'down' : ''}`}>{res.worst ? fmtPct(res.worst.net, 1) : '—'}</b>
                </div>
                <div>
                  <span>Месяцев в минус</span>
                  <b className="num">{res.neg}</b>
                </div>
              </div>
            </div>
            <AreaChart data={res.pts} height={200} endLabel ariaLabel="Накопленный результат симуляции по месяцам" valueLabel="Накоплено" />
            <p className="pub-note sim-note">
              Расчет по средней доходности всех ботов стратегии, после комиссий бирж и фандинга. Ваш результат зависит от монет, суммы, плеча и момента входа и может
              отличаться в обе стороны. Прошлые результаты не обещают будущих.
            </p>
            <a className="pub-btn pub-primary sim-cta" href={links.register}>
              Попробовать на демо-счете <span className="pub-arrow" aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      )}
    </Section>
  )
}
