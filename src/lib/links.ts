const ORIGIN = ((import.meta.env.VITE_APP_ORIGIN as string | undefined) ?? 'https://dstrade.io').replace(/\/$/, '')

/** Ссылки на основной сайт и кабинет DSTrade. */
export const links = {
  home: `${ORIGIN}/`,
  login: `${ORIGIN}/login`,
  register: `${ORIGIN}/register`,
  pricing: `${ORIGIN}/#pricing`,
  faq: `${ORIGIN}/#faq`,
  terms: `${ORIGIN}/terms`,
  privacy: `${ORIGIN}/privacy`,
  community: (import.meta.env.VITE_COMMUNITY_URL as string | undefined) ?? 'https://t.me/+kieb_uZvVTdkZTQ6',
  tradingView: (symbol: string, exchange = 'BYBIT') => `https://www.tradingview.com/chart/?symbol=${exchange}%3A${symbol}USDT.P`,
}
