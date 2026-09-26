import { useState } from 'react'
import { COIN_META } from '../../content/coins'

/** Иконка монеты: SVG из /public/coins, для остальных — фирменный цвет и буквы. */
export function CoinIcon({ symbol, size = 'md' }: { symbol: string; size?: 'md' | 'lg' }) {
  const meta = COIN_META[symbol]
  const [broken, setBroken] = useState(false)
  const cls = `coin-ic ${size === 'lg' ? 'lg' : ''}`
  if (meta?.icon && !broken) {
    return (
      <span className={cls}>
        <img src={`${import.meta.env.BASE_URL}coins/${symbol.toLowerCase()}.svg`} alt="" loading="lazy" onError={() => setBroken(true)} />
      </span>
    )
  }
  const letters = symbol.length > 4 ? symbol.slice(0, 2) : symbol.slice(0, symbol.length > 3 ? 2 : symbol.length)
  return (
    <span className={`${cls} fallback`} style={{ background: meta?.color ?? '#2a3350', color: meta?.ink ?? '#fff' }} aria-hidden="true">
      {letters}
    </span>
  )
}

export function Coin({ symbol, name, sub }: { symbol: string; name?: string; sub?: boolean }) {
  return (
    <span className="coin">
      <CoinIcon symbol={symbol} />
      <span style={{ minWidth: 0 }}>
        <span className="coin-sym">{symbol}</span>
        {sub && name && <span className="coin-name" style={{ display: 'block' }}>{name}</span>}
      </span>
    </span>
  )
}
