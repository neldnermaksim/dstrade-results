import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: ReactNode
  label: string
  children: ReactNode
  footer?: ReactNode
}

/** Боковая панель — как «Добавить бота» в кабинете. Esc закрывает, фон не прокручивается. */
export function Drawer({ open, onClose, title, label, children, footer }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    lastFocus.current = document.activeElement as HTMLElement
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus())
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
      lastFocus.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="public-site-portal">
      <div className="pub-scrim" onClick={onClose} aria-hidden="true" />
      <div ref={panel} className="pub-drawer" role="dialog" aria-modal="true" aria-label={label}>
        <div className="pub-drawer-head">
          <div style={{ minWidth: 0, flex: 1 }}>{title}</div>
          <button type="button" className="pub-icon-btn" onClick={onClose} aria-label="Закрыть" data-autofocus>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="pub-drawer-body">{children}</div>
        {footer && <div className="pub-drawer-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
