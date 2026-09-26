import type { PeriodKey } from '../../api/types'
import { PERIODS } from '../../content/dictionary'
import { Segmented } from './Segmented'

export function PeriodSwitch({
  value,
  onChange,
  size = 'md',
  only,
}: {
  value: PeriodKey
  onChange: (p: PeriodKey) => void
  size?: 'md' | 'sm' | 'xs'
  only?: PeriodKey[]
}) {
  const opts = PERIODS.filter((p) => !only || only.includes(p.key)).map((p) => ({ value: p.key, label: p.label, title: p.long }))
  return <Segmented label="Период" options={opts} value={value} onChange={onChange} size={size} />
}
