import type { ReactNode } from 'react'

interface Props {
  id?: string
  eyebrow: string
  title: ReactNode
  text?: ReactNode
  side?: ReactNode
  children: ReactNode
  tight?: boolean
}

/** Секция в ритме главной dstrade.io: «01 / НАЗВАНИЕ», крупный заголовок, пояснение справа. */
export function Section({ id, eyebrow, title, text, side, children, tight }: Props) {
  return (
    <section id={id} className={`pub-section ${tight ? 'pub-tight' : ''}`} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="pub-wrap">
        <div className="pub-eyebrow">{eyebrow}</div>
        <div className="pub-section-top">
          <h2 id={id ? `${id}-title` : undefined}>{title}</h2>
          {(text || side) && (
            <div className="pub-section-side">
              {text && <p>{text}</p>}
              {side}
            </div>
          )}
        </div>
        {children}
      </div>
    </section>
  )
}
