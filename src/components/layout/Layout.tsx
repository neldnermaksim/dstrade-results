import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { MotionProvider } from '../../lib/motion'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // html { scroll-behavior: smooth } не должен анимировать переход между страницами
    const html = document.documentElement
    const prev = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    html.style.scrollBehavior = prev
  }, [pathname])
  return null
}

export function Layout() {
  return (
    <div className="public-site">
      <MotionProvider>
        <a className="skip" href="#main">
          Перейти к содержимому
        </a>
        <ScrollToTop />
        <Header />
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
        <Footer />
      </MotionProvider>
    </div>
  )
}
