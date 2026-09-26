import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('Страница не найдена')
  return (
    <section className="pub-closing notfound view-enter">
      <div className="pub-wrap">
        <div className="pub-eyebrow">Ошибка 404</div>
        <h2>
          Такой страницы нет.
          <br />
          <span className="pub-grad">Цифры — на месте.</span>
        </h2>
        <div className="pub-closing-actions">
          <Link className="pub-btn pub-primary" to="/">
            К результатам <span className="pub-arrow" aria-hidden="true">↗</span>
          </Link>
          <Link className="pub-btn" to="/reports">
            Отчеты по месяцам
          </Link>
        </div>
      </div>
    </section>
  )
}
