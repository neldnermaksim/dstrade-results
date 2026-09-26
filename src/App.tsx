import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Overview } from './pages/Overview'

const Strategies = lazy(() => import('./pages/Strategies'))
const Coins = lazy(() => import('./pages/Coins'))
const Reports = lazy(() => import('./pages/Reports'))
const Report = lazy(() => import('./pages/Report'))
const Methodology = lazy(() => import('./pages/Methodology'))
const NotFound = lazy(() => import('./pages/NotFound'))

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

export function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Overview />} />
          <Route
            path="strategies"
            element={
              <Suspense fallback={<PageFallback />}>
                <Strategies />
              </Suspense>
            }
          />
          <Route
            path="coins"
            element={
              <Suspense fallback={<PageFallback />}>
                <Coins />
              </Suspense>
            }
          />
          <Route
            path="reports"
            element={
              <Suspense fallback={<PageFallback />}>
                <Reports />
              </Suspense>
            }
          />
          <Route
            path="reports/:ym"
            element={
              <Suspense fallback={<PageFallback />}>
                <Report />
              </Suspense>
            }
          />
          <Route
            path="methodology"
            element={
              <Suspense fallback={<PageFallback />}>
                <Methodology />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <Suspense fallback={<PageFallback />}>
                <NotFound />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function PageFallback() {
  return <div className="pub-wrap" style={{ minHeight: '60vh' }} aria-busy="true" />
}
