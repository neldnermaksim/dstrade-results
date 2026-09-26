import { Link } from 'react-router-dom'
import { BrandLogo, TelegramIcon } from './BrandLogo'
import { links } from '../../lib/links'

export function Footer() {
  return (
    <footer className="pub-footer">
      <div className="pub-wrap">
        <div className="pub-footer-top">
          <a className="pub-brand" href={links.home} aria-label="DSTrade — главная">
            <BrandLogo />
          </a>
          <div className="pub-footer-links">
            <a
              className="pub-community"
              href={links.community}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Сообщество в Telegram — открыть в новой вкладке"
            >
              <TelegramIcon />
              <span>Сообщество в Telegram</span>
              <span className="pub-muted" aria-hidden="true">
                ↗
              </span>
            </a>
            <Link to="/methodology">Методика расчета</Link>
            <a href={links.pricing}>Тарифы</a>
            <a href={links.terms}>Условия использования</a>
            <a href={links.privacy}>Политика конфиденциальности</a>
            <a href={links.login}>Войти ↗</a>
          </div>
        </div>
        <p>
          Показаны сводные результаты ботов на реальных счетах пользователей: средняя доходность на выделенную сумму, без учета подушки. Результаты в каждом
          конкретном случае могут отличаться. Прошлые результаты не обещают будущих.
        </p>
        <p>
          Торговля криптовалютными фьючерсами связана с риском потери средств. Алгоритмы не гарантируют прибыль. DSTrade — инструмент автоматизации, а не
          индивидуальная инвестиционная рекомендация.
        </p>
      </div>
    </footer>
  )
}
