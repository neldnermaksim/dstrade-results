import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { BrandLogo, TelegramIcon } from './BrandLogo'
import { links } from '../../lib/links'

export const NAV = [
  { to: '/', label: 'Обзор', end: true },
  { to: '/strategies', label: 'Стратегии' },
  { to: '/coins', label: 'Монеты' },
  { to: '/reports', label: 'Отчеты' },
  { to: '/methodology', label: 'Методика' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])

  return (
    <>
      <header className="pub-header pub-wrap">
        <Link className="pub-brand" to="/" aria-label="Результаты DSTrade — главная">
          <BrandLogo />
          <span className="pub-brand-sub">Результаты</span>
        </Link>
        <nav className="pub-nav" aria-label="Разделы результатов">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="pub-header-actions">
          <a
            className="pub-header-community"
            href={links.community}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Сообщество в Telegram — открыть в новой вкладке"
            title="Сообщество в Telegram"
          >
            <TelegramIcon />
          </a>
          <a className="pub-btn pub-ghost" href={links.login}>
            Войти
          </a>
          <a className="pub-btn pub-primary" href={links.register}>
            Регистрация <span className="pub-arrow" aria-hidden="true">↗</span>
          </a>
          <button
            type="button"
            className="pub-btn pub-menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </header>
      {open && (
        <nav id="mobile-nav" className="pub-mobile-nav pub-wrap" aria-label="Разделы результатов">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              {n.label}
            </NavLink>
          ))}
          <a className="pub-mobile-login" href={links.login}>
            Войти в кабинет <span aria-hidden="true" style={{ marginLeft: 6 }}>↗</span>
          </a>
          <a className="pub-mobile-community" href={links.community} target="_blank" rel="noopener noreferrer">
            <TelegramIcon size={18} />
            <span>Сообщество в Telegram</span>
            <span className="pub-muted" style={{ marginLeft: 'auto' }} aria-hidden="true">
              ↗
            </span>
          </a>
        </nav>
      )}
    </>
  )
}
