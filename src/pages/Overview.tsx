import { useDocumentTitle } from '../lib/useDocumentTitle'
import { Hero } from './overview/Hero'
import { KeyStats } from './overview/KeyStats'
import { StrategyCards } from './overview/StrategyCards'
import { MonthlySection } from './overview/MonthlySection'
import { SpotSection } from './overview/SpotSection'
import { TopCoinsSection } from './overview/TopCoinsSection'
import { CalendarSection } from './overview/CalendarSection'
import { Simulator } from './overview/Simulator'
import { HowSection } from './overview/HowSection'
import { Closing } from './overview/Closing'

export function Overview() {
  useDocumentTitle('Результаты')
  return (
    <div className="view-enter">
      <Hero />
      <KeyStats />
      <StrategyCards />
      <MonthlySection />
      <SpotSection />
      <TopCoinsSection />
      <CalendarSection />
      <Simulator />
      <HowSection />
      <Closing />
    </div>
  )
}
