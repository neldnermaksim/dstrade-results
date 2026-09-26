import { useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

/** Подсказка «i» рядом с названием метрики. */
export function Hint({ children, label = 'Подробнее' }: { children: ReactNode; label?: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number; below: boolean } | null>(null)

  const show = () => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const below = r.top < 140
    setPos({ x: Math.min(window.innerWidth - 296, Math.max(12, r.left + r.width / 2 - 140)), y: below ? r.bottom + 8 : r.top - 8, below })
  }

  return (
    <>
      <button
        ref={ref}
        type="button"
        className="pub-hint"
        aria-label={label}
        onMouseEnter={show}
        onMouseLeave={() => setPos(null)}
        onFocus={show}
        onBlur={() => setPos(null)}
        onClick={(e) => {
          e.stopPropagation()
          if (pos) setPos(null)
          else show()
        }}
      >
        <Info size={13} aria-hidden="true" />
      </button>
      {pos &&
        createPortal(
          <div className="pub-tip" role="tooltip" style={{ left: pos.x, top: pos.y, transform: pos.below ? undefined : 'translateY(-100%)' }}>
            {children}
          </div>,
          document.body,
        )}
    </>
  )
}
