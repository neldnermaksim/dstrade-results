export const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
export const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
export const MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

const pad = (n: number) => String(n).padStart(2, '0')

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const toYM = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`

/** Разбор YYYY-MM-DD без сдвига часового пояса. */
export const parseISODate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export const addDays = (d: Date, n: number) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export const addMonthsYM = (ym: string, n: number) => {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return toYM(d)
}

export const daysInMonth = (y: number, m0: number) => new Date(y, m0 + 1, 0).getDate()

export const ymParts = (ym: string) => {
  const [y, m] = ym.split('-').map(Number)
  return { year: y, month0: m - 1 }
}

/** «Сентябрь 2026» */
export const ymTitle = (ym: string) => {
  const { year, month0 } = ymParts(ym)
  return `${MONTHS[month0]} ${year}`
}

/** «26.09.2026» */
export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

/** «26.09» */
export const fmtDateShort = (iso: string) => {
  const [, m, d] = iso.split('-')
  return `${d}.${m}`
}

/** «26 сентября» */
export const fmtDayMonth = (iso: string) => {
  const d = parseISODate(iso)
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
}

/** «суббота, 26 сентября» — как в шапке «Обзора» кабинета. */
export const fmtWeekdayDate = (d: Date) => `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`

export const fmtDateTime = (iso: string) => {
  const d = new Date(iso)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
