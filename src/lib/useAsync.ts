import { useCallback, useEffect, useRef, useState } from 'react'

export interface AsyncState<T> {
  data: T | undefined
  error: Error | undefined
  /** Первая загрузка — данных еще нет. */
  loading: boolean
  /** Данные есть, идет обновление (сменили период/фильтр). */
  refreshing: boolean
  reload: () => void
}

/**
 * Загрузка данных с сохранением предыдущего результата на время обновления —
 * как в «Статистике» кабинета: «· Обновляем…» вместо пустого экрана.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<Error>()
  const [pending, setPending] = useState(true)
  const [nonce, setNonce] = useState(0)
  const seq = useRef(0)

  useEffect(() => {
    const id = ++seq.current
    setPending(true)
    setError(undefined)
    fn()
      .then((d) => {
        if (id === seq.current) setData(d)
      })
      .catch((e: unknown) => {
        if (id === seq.current) setError(e instanceof Error ? e : new Error(String(e)))
      })
      .finally(() => {
        if (id === seq.current) setPending(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return { data, error, loading: pending && data === undefined, refreshing: pending && data !== undefined, reload }
}
