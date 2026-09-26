import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface MotionCtx {
  paused: boolean
  toggle: () => void
}

const Ctx = createContext<MotionCtx>({ paused: false, toggle: () => {} })
const KEY = 'dst.results.motion'

const readStored = (): boolean | null => {
  try {
    const v = localStorage.getItem(KEY)
    return v === null ? null : v === 'paused'
  } catch {
    return null
  }
}

/** Пауза непрерывной анимации — как кнопка «Пауза анимации» на главной dstrade.io. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState<boolean>(() => {
    const stored = readStored()
    if (stored !== null) return stored
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const root = document.querySelector('.public-site')
    root?.classList.toggle('continuous-paused', paused)
    root?.classList.toggle('motion-enabled', !paused)
  }, [paused])

  const toggle = useCallback(() => {
    setPaused((p) => {
      try {
        localStorage.setItem(KEY, p ? 'running' : 'paused')
      } catch {
        /* приватный режим — просто не запоминаем */
      }
      return !p
    })
  }, [])

  const value = useMemo(() => ({ paused, toggle }), [paused, toggle])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useMotion = () => useContext(Ctx)
