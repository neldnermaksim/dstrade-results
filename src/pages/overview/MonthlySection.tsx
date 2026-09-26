import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'
import type { MatrixRow } from '../../api/types'
import { HeatTable } from '../../components/charts/HeatTable'
import { StageBadge } from '../../components/ui/Badges'
import { CoinIcon } from '../../components/ui/CoinIcon'
import { Segmented } from '../../components/ui/Segmented'
import { Section } from '../../components/ui/Section'
import { ErrorState, Skeleton, Updating } from '../../components/ui/States'
import { currentYM } from '../../lib/clock'
import { useAsync } from '../../lib/useAsync'

type View = 'segments' | 'long' | 'short' | 'stages'

const FIRST_YEAR = 2025

export function MonthlySection() {
  const thisYear = Number(currentYM.slice(0, 4))
  const years = Array.from({ length: thisYear - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i)
  const [year, setYear] = useState(thisYear)
  const [view, setView] = useState<View>('segments')
  const navigate = useNavigate()

  const q = useAsync(
    () => (view === 'segments' ? api.monthly(year, 'segments') : view === 'stages' ? api.monthly(year, 'stages') : api.monthly(year, 'coins', view === 'long' ? 'LONG' : 'SHORT', 15)),
    [year, view],
  )

  const label = (r: MatrixRow) => {
    if (r.symbol)
      return (
        <span className="coin">
          <CoinIcon symbol={r.symbol} />
          <span className="coin-sym">{r.symbol}</span>
        </span>
      )
    if (r.stage) return <StageBadge stage={r.stage} />
    return r.label
  }

  const firstCol = view === 'segments' ? 'Стратегия' : view === 'stages' ? 'Стадия' : 'Монета топ-15'

  return (
    <Section
      id="monthly"
      eyebrow="03 / Месяц за месяцем"
      title={
        <>
          Каждый месяц.
          <br />
          <span className="pub-accent">Без пропусков.</span>
        </>
      }
      text="Средняя доходность на выделенную сумму по месяцам. Слабые и отрицательные месяцы показаны так же, как сильные."
    >
      <div className="pub-toolbar">
        <Segmented
          label="Разрез таблицы"
          value={view}
          onChange={setView}
          options={[
            { value: 'segments', label: 'Стратегии' },
            { value: 'long', label: 'Монеты · LONG' },
            { value: 'short', label: 'Монеты · SHORT' },
            { value: 'stages', label: 'Стадии Auto' },
          ]}
        />
        <div className="pub-toolbar-group">
          <Updating on={q.refreshing} />
          <Segmented label="Год" value={year} onChange={setYear} options={years.map((y) => ({ value: y, label: String(y) }))} size="sm" />
        </div>
      </div>
      <div className="pub-panel pad heat-panel">
        {q.error && !q.data ? (
          <ErrorState onRetry={q.reload} />
        ) : !q.data ? (
          <Skeleton h={view === 'segments' ? 200 : 520} />
        ) : (
          <div className={q.refreshing ? 'is-refreshing' : ''}>
            <HeatTable
              matrix={q.data}
              rowLabel={label}
              firstCol={firstCol}
              currentYM={currentYM}
              onPickRow={view === 'long' || view === 'short' ? (r) => r.symbol && navigate(`/coins?coin=${r.symbol}&dir=${view === 'long' ? 'LONG' : 'SHORT'}`) : undefined}
            />
          </div>
        )}
        <div className="heat-foot">
          <div className="pub-heat-legend">
            <span>убыток</span>
            <i aria-hidden="true" />
            <span>прибыль</span>
          </div>
          <span className="pub-caption">
            <span className="acc">•</span> — месяц еще идет · «В месяц» — среднее по завершенным месяцам
          </span>
        </div>
      </div>
    </Section>
  )
}
