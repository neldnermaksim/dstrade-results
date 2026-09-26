import type { ReactElement } from 'react'
import type { ExchangeKey } from '../../api/types'
import { EXCHANGES, EXCHANGE_ORDER } from '../../content/dictionary'

const ICONS: Record<ExchangeKey, ReactElement> = {
  binance: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#F3BA2F" d="M7.4 10.3 12 5.7l4.6 4.6 2.7-2.7L12 .3 4.7 7.6zM.3 12l2.7-2.7L5.7 12 3 14.7zm7.1 1.7L12 18.3l4.6-4.6 2.7 2.7L12 23.7l-7.3-7.3zm10.9-1.7 2.7-2.7 2.7 2.7-2.7 2.7zM14.7 12 12 9.3 10 11.3l-.2.2-.5.5L12 14.7z" />
    </svg>
  ),
  bybit: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <text x="2" y="16" fontSize="9.5" fontWeight="800" fill="#fff" fontFamily="Manrope, sans-serif">BY</text>
      <rect x="15.4" y="7" width="1.9" height="6.6" fill="#F7A600" />
      <text x="17.6" y="16" fontSize="9.5" fontWeight="800" fill="#fff" fontFamily="Manrope, sans-serif">T</text>
    </svg>
  ),
  bitget: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#00F0FF" d="M9.3 4h6.4l-5 5 5.8 5.9L9.8 21H3.4l6.7-6.7L4.3 8.4Zm5.4 0h6l-4 4-3-3z" opacity=".95" />
    </svg>
  ),
  okx: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g fill="#fff">
        <rect x="4" y="4" width="5" height="5" rx=".6" />
        <rect x="15" y="4" width="5" height="5" rx=".6" />
        <rect x="9.5" y="9.5" width="5" height="5" rx=".6" />
        <rect x="4" y="15" width="5" height="5" rx=".6" />
        <rect x="15" y="15" width="5" height="5" rx=".6" />
      </g>
    </svg>
  ),
}

/** Плитки бирж, на которых монета торгуется бессрочным контрактом — как колонка «Биржи» в скринере. */
export function ExchangeTiles({ list }: { list: ExchangeKey[] }) {
  const sorted = EXCHANGE_ORDER.filter((e) => list.includes(e))
  return (
    <span className="ex-tiles">
      {sorted.map((e) => (
        <span key={e} className="ex-tile" title={`Торгуется на ${EXCHANGES[e].name}`}>
          {ICONS[e]}
          <span className="sr-only">{EXCHANGES[e].name}</span>
        </span>
      ))}
    </span>
  )
}

export function ExchangeIcon({ ex }: { ex: ExchangeKey }) {
  return <span className="ex-tile">{ICONS[ex]}</span>
}
