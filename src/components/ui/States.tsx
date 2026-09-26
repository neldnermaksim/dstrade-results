import { AlertCircle, Loader2 } from 'lucide-react'

export function Skeleton({ h = 200, w = '100%', r = 12 }: { h?: number; w?: number | string; r?: number }) {
  return <div className="skel" style={{ height: h, width: w, borderRadius: r }} aria-hidden="true" />
}

export function ErrorState({ onRetry, text }: { onRetry?: () => void; text?: string }) {
  return (
    <div className="pub-empty err" role="alert">
      <AlertCircle size={20} aria-hidden="true" />
      <span>{text ?? 'Не удалось загрузить статистику. Обновите страницу или попробуйте позже.'}</span>
      {onRetry && (
        <button type="button" className="pub-btn pub-sm" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  )
}

export function Empty({ text }: { text: string }) {
  return <div className="pub-empty">{text}</div>
}

/** «· Обновляем…» — как в заголовке статистики кабинета при смене периода. */
export function Updating({ on }: { on: boolean }) {
  if (!on) return null
  return (
    <span className="pub-updating" aria-live="polite">
      <Loader2 size={13} className="spin" aria-hidden="true" /> Обновляем…
    </span>
  )
}
