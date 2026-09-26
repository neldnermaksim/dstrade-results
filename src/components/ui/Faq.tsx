import type { ReactNode } from 'react'

export function Faq({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div>
      {items.map((it) => (
        <details key={it.q} className="pub-faq">
          <summary>{it.q}</summary>
          <div className="pub-faq-answer">{it.a}</div>
        </details>
      ))}
    </div>
  )
}
