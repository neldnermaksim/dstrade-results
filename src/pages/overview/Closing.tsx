import type { ReactNode } from 'react'
import { links } from '../../lib/links'

export function Closing({ title, text }: { title?: ReactNode; text?: string }) {
  return (
    <section className="pub-closing" aria-labelledby="closing-title">
      <div className="pub-wrap">
        <div className="pub-eyebrow">Ваш следующий шаг</div>
        <h2 id="closing-title">
          {title ?? (
            <>
              Посмотрели цифры.
              <br />
              <span className="pub-grad">Проверьте на демо.</span>
            </>
          )}
        </h2>
        <div className="pub-closing-actions">
          <a className="pub-btn pub-primary" href={links.register}>
            Регистрация <span className="pub-arrow" aria-hidden="true">↗</span>
          </a>
          <a className="pub-btn" href={links.login}>
            Войти в кабинет
          </a>
        </div>
        <p>{text ?? '5 демо-ботов без подписки. Средства остаются на вашей бирже — подключение ключом без права вывода.'}</p>
      </div>
    </section>
  )
}
