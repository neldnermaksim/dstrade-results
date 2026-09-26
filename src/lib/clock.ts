import { addDays, toISODate, toYM } from './dates'

/** Последний полный день данных (расчет раз в сутки — вчера). Используется для значений по умолчанию в UI. */
export const lastDay = (() => {
  const n = new Date()
  return addDays(new Date(n.getFullYear(), n.getMonth(), n.getDate()), -1)
})()
export const lastISO = toISODate(lastDay)
export const currentYM = toYM(lastDay)
