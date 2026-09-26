import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption<T extends string> {
  value: T
  label: ReactNode
  meta?: ReactNode
  group?: string
}

interface Props<T extends string> {
  options: SelectOption<T>[]
  value: T
  onChange: (v: T) => void
  label: string
  render?: (o: SelectOption<T>) => ReactNode
  minWidth?: number
}

/** Выпадающий список с клавиатурой — по мотивам «Все боты» в статистике кабинета. */
export function Select<T extends string>({ options, value, onChange, label, render, minWidth }: Props<T>) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const id = useId()
  const current = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (open) {
      const i = Math.max(0, options.findIndex((o) => o.value === value))
      setActive(i)
      requestAnimationFrame(() => {
        list.current?.focus()
        list.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' })
      })
    }
  }, [open, options, value])

  const pick = (i: number) => {
    const o = options[i]
    if (o) onChange(o.value)
    setOpen(false)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const n = (active + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
      setActive(n)
      list.current?.querySelector(`[data-i="${n}"]`)?.scrollIntoView({ block: 'nearest' })
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      pick(active)
    }
  }

  let lastGroup: string | undefined
  return (
    <div className="pub-select" ref={root}>
      <button
        type="button"
        className="pub-select-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        style={minWidth ? { minWidth } : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{current ? (render ? render(current) : current.label) : '—'}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={list}
          className="pub-select-list"
          role="listbox"
          id={id}
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onKey}
        >
          {options.map((o, i) => {
            const header = o.group && o.group !== lastGroup ? o.group : null
            lastGroup = o.group
            return (
              <div key={o.value}>
                {header && <div className="pub-select-group">{header}</div>}
                <div
                  id={`${id}-${i}`}
                  data-i={i}
                  role="option"
                  aria-selected={o.value === value}
                  className={i === active ? 'active' : ''}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(i)}
                >
                  <span>{render ? render(o) : o.label}</span>
                  {o.meta && <span className="opt-meta">{o.meta}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
