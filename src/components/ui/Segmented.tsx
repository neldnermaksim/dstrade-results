import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export interface SegOption<T extends string | number> {
  value: T
  label: ReactNode
  title?: string
  disabled?: boolean
}

interface Props<T extends string | number> {
  options: SegOption<T>[]
  value: T
  onChange: (v: T) => void
  label: string
  size?: 'md' | 'sm' | 'xs'
  className?: string
}

/** Сегментный переключатель с плавающим индикатором — как «Месяц / Год» в тарифах dstrade.io. */
export function Segmented<T extends string | number>({ options, value, onChange, label, size = 'md', className = '' }: Props<T>) {
  const ref = useRef<HTMLDivElement>(null)
  const [ind, setInd] = useState<{ x: number; w: number } | null>(null)

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const measure = () => {
      const btn = root.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')
      if (!btn) return setInd(null)
      setInd({ x: btn.offsetLeft, w: btn.offsetWidth })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    return () => ro.disconnect()
  }, [value, options.length])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const enabled = options.filter((o) => !o.disabled)
    const i = enabled.findIndex((o) => o.value === value)
    const next = enabled[(i + (e.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length]
    if (next) {
      e.preventDefault()
      onChange(next.value)
      requestAnimationFrame(() => ref.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus())
    }
  }

  const sizeCls = size === 'sm' ? 'pub-seg-sm' : size === 'xs' ? 'pub-seg-xs' : ''
  return (
    <div ref={ref} className={`pub-segments ${sizeCls} ${className}`} role="group" aria-label={label} onKeyDown={onKey}>
      {ind && <span className="pub-seg-ind" style={{ transform: `translateX(${ind.x}px)`, width: ind.w }} aria-hidden="true" />}
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          disabled={o.disabled}
          title={o.title}
          tabIndex={o.value === value ? 0 : -1}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
