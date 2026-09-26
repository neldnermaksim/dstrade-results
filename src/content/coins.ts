import type { ExchangeKey } from '../api/types'

export interface CoinMeta {
  symbol: string
  name: string
  /** Цвет фолбэк-иконки, если нет SVG в /public/coins. */
  color: string
  /** Цвет буквы на фолбэк-иконке. */
  ink?: string
  icon?: boolean
}

/** Метаданные монет для иконок и подписей. Иконки — /public/coins/{symbol}.svg (набор cryptocurrency-icons, CC0). */
export const COIN_META: Record<string, CoinMeta> = {
  BTC: { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', icon: true },
  ETH: { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', icon: true },
  BNB: { symbol: 'BNB', name: 'BNB', color: '#F3BA2F', icon: true },
  XRP: { symbol: 'XRP', name: 'XRP', color: '#23292F', icon: true },
  SOL: { symbol: 'SOL', name: 'Solana', color: '#08090b', icon: true },
  TRX: { symbol: 'TRX', name: 'TRON', color: '#EF0027', icon: true },
  DOGE: { symbol: 'DOGE', name: 'Dogecoin', color: '#C2A633', icon: true },
  HYPE: { symbol: 'HYPE', name: 'Hyperliquid', color: '#97FCE4', ink: '#072723' },
  ADA: { symbol: 'ADA', name: 'Cardano', color: '#0D1E30', icon: true },
  LINK: { symbol: 'LINK', name: 'Chainlink', color: '#2A5ADA', icon: true },
  XLM: { symbol: 'XLM', name: 'Stellar', color: '#14B6E7', icon: true },
  BCH: { symbol: 'BCH', name: 'Bitcoin Cash', color: '#8DC351', icon: true },
  SUI: { symbol: 'SUI', name: 'Sui', color: '#4DA2FF' },
  AVAX: { symbol: 'AVAX', name: 'Avalanche', color: '#E84142', icon: true },
  LTC: { symbol: 'LTC', name: 'Litecoin', color: '#BFBBBB', icon: true },
  HBAR: { symbol: 'HBAR', name: 'Hedera', color: '#222222' },
  TON: { symbol: 'TON', name: 'Toncoin', color: '#0098EA' },
  DOT: { symbol: 'DOT', name: 'Polkadot', color: '#E6007A', icon: true },
  UNI: { symbol: 'UNI', name: 'Uniswap', color: '#FF007A', icon: true },
  NEAR: { symbol: 'NEAR', name: 'NEAR Protocol', color: '#00EC97', ink: '#06140e' },
  APT: { symbol: 'APT', name: 'Aptos', color: '#1C1F26' },
  AAVE: { symbol: 'AAVE', name: 'Aave', color: '#2EBAC6', icon: true },
  ETC: { symbol: 'ETC', name: 'Ethereum Classic', color: '#328332', icon: true },
  ARB: { symbol: 'ARB', name: 'Arbitrum', color: '#28A0F0' },
  ENA: { symbol: 'ENA', name: 'Ethena', color: '#111111' },
  INJ: { symbol: 'INJ', name: 'Injective', color: '#0082FA' },
  FIL: { symbol: 'FIL', name: 'Filecoin', color: '#0090FF', icon: true },
  ATOM: { symbol: 'ATOM', name: 'Cosmos', color: '#2E3148' },
  OP: { symbol: 'OP', name: 'Optimism', color: '#FF0420' },
  SHIB: { symbol: 'SHIB', name: 'Shiba Inu', color: '#FFA409', ink: '#2b1700' },
  // монеты вне портфеля — встречаются у DCA · Auto
  PEPE: { symbol: 'PEPE', name: 'Pepe', color: '#3D9A36' },
  WIF: { symbol: 'WIF', name: 'dogwifhat', color: '#C29A6A', ink: '#241708' },
  CHR: { symbol: 'CHR', name: 'Chromia', color: '#F07C83' },
  MUBARAK: { symbol: 'MUBARAK', name: 'Mubarak', color: '#E3B341', ink: '#2a1d00' },
  LSK: { symbol: 'LSK', name: 'Lisk', color: '#4070F4' },
  CVC: { symbol: 'CVC', name: 'Civic', color: '#3AB03E' },
  SAGA: { symbol: 'SAGA', name: 'Saga', color: '#E55F2B' },
  TRUMP: { symbol: 'TRUMP', name: 'Official Trump', color: '#C79A2E', ink: '#241800' },
  BONK: { symbol: 'BONK', name: 'Bonk', color: '#F8A91B', ink: '#2a1700' },
  STRK: { symbol: 'STRK', name: 'Starknet', color: '#29296E' },
  PENGU: { symbol: 'PENGU', name: 'Pudgy Penguins', color: '#7AB8F5', ink: '#0b1a2a' },
  FARTCOIN: { symbol: 'FARTCOIN', name: 'Fartcoin', color: '#8FD14F', ink: '#132005' },
  VIRTUAL: { symbol: 'VIRTUAL', name: 'Virtuals Protocol', color: '#2D3B4E' },
  TIA: { symbol: 'TIA', name: 'Celestia', color: '#7B2BF9' },
  WLD: { symbol: 'WLD', name: 'Worldcoin', color: '#1A1A1A' },
}

export const coinName = (s: string) => COIN_META[s]?.name ?? s

/** Портфель скринера: 30 монет по капитализации (Топ-10 / 20 / 30). vol — относительная волатильность для демо-данных. */
export const PORTFOLIO: { symbol: string; vol: number; exchanges: ExchangeKey[] }[] = [
  { symbol: 'BTC', vol: 0.42, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'ETH', vol: 0.62, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'BNB', vol: 0.5, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'XRP', vol: 0.86, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'SOL', vol: 0.8, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'TRX', vol: 0.38, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'DOGE', vol: 1.08, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'HYPE', vol: 1.55, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'ADA', vol: 0.98, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'LINK', vol: 0.9, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'XLM', vol: 1.12, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'BCH', vol: 0.85, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'SUI', vol: 1.3, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'AVAX', vol: 0.94, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'LTC', vol: 0.72, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'HBAR', vol: 1.18, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'TON', vol: 0.78, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'DOT', vol: 0.82, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'UNI', vol: 1.02, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'NEAR', vol: 1.16, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'APT', vol: 1.05, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'AAVE', vol: 1.0, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'ETC', vol: 0.8, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'ARB', vol: 1.1, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'ENA', vol: 1.45, exchanges: ['binance', 'bybit', 'bitget'] },
  { symbol: 'INJ', vol: 1.22, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'FIL', vol: 0.96, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'ATOM', vol: 0.88, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'OP', vol: 1.12, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
  { symbol: 'SHIB', vol: 1.06, exchanges: ['binance', 'bybit', 'bitget', 'okx'] },
]

/** Монеты вне портфеля, которые DCA · Auto берет по сигналам скринера. */
export const AUTO_UNIVERSE = ['PEPE', 'WIF', 'CHR', 'MUBARAK', 'LSK', 'CVC', 'SAGA', 'TRUMP', 'BONK', 'STRK', 'PENGU', 'FARTCOIN', 'VIRTUAL', 'TIA', 'WLD']
