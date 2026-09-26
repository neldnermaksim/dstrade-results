import { useEffect } from 'react'

/** Заголовок вкладки в формате основного сайта: «Раздел — DSTrade». */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} — DSTrade` : 'Результаты — DSTrade'
  }, [title])
}
