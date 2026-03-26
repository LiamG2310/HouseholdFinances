import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FinanceProvider } from './context/FinanceContext.jsx'
import { BottomNav } from './components/layout/BottomNav.jsx'
import { PinGate } from './components/PinGate.jsx'
import { GistSync } from './components/GistSync.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { BillsPage } from './pages/BillsPage.jsx'
import { IncomePage } from './pages/IncomePage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'
const TABS = ['dashboard', 'bills', 'income', 'settings']

const pageVariants = {
  enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
}

const pageTransition = { type: 'tween', ease: 'easeInOut', duration: 0.22 }

function App() {
  const [page, setPage] = useState('dashboard')
  const dirRef = useRef(0)

  const navigate = (next) => {
    dirRef.current = TABS.indexOf(next) > TABS.indexOf(page) ? 1 : -1
    setPage(next)
  }

  const pages = { dashboard: DashboardPage, bills: BillsPage, income: IncomePage, settings: SettingsPage }
  const PageComponent = pages[page]

  return (
    <PinGate>
      <GistSync>
        <FinanceProvider>
          <div className="flex flex-col min-h-svh bg-slate-900 overflow-hidden pt-safe" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
            <AnimatePresence mode="wait" custom={dirRef.current}>
              <motion.div
                key={page}
                custom={dirRef.current}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={pageTransition}
                className="flex flex-col flex-1"
              >
                <PageComponent />
              </motion.div>
            </AnimatePresence>
          </div>
          <BottomNav active={page} onSelect={navigate} />
        </FinanceProvider>
      </GistSync>
    </PinGate>
  )
}

export default App
