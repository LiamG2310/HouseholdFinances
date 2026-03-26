import { useState, useRef, useEffect } from 'react'
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
  const [page, setPage] = useState(() => sessionStorage.getItem('hf_page') || 'dashboard')
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('tl')
    if (!p) return
    window.history.replaceState({}, '', window.location.pathname)
    if (p === 'connected') { sessionStorage.setItem('hf_page', 'settings'); setPage('settings') }
  }, [])
  const dirRef = useRef(0)

  const navigate = (next) => {
    dirRef.current = TABS.indexOf(next) > TABS.indexOf(page) ? 1 : -1
    sessionStorage.setItem('hf_page', next)
    setPage(next)
  }

  const pages = { dashboard: DashboardPage, bills: BillsPage, income: IncomePage, settings: SettingsPage }
  const PageComponent = pages[page]

  return (
    <PinGate>
      <GistSync>
        <FinanceProvider>
          {/* height:100svh + flex column = BottomNav stays pinned without position:fixed,
              which prevents the iOS PWA viewport-shift jump on scroll-heavy pages */}
          <div className="flex flex-col bg-slate-900 pt-safe" style={{ height: '100dvh' }}>
            <div className="flex-1 min-h-0" style={{ overflowX: 'clip' }}>
              <AnimatePresence mode="wait" custom={dirRef.current}>
                <motion.div
                  key={page}
                  custom={dirRef.current}
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={pageTransition}
                  className="flex flex-col h-full"
                >
                  <PageComponent />
                </motion.div>
              </AnimatePresence>
            </div>
            <BottomNav active={page} onSelect={navigate} />
          </div>
        </FinanceProvider>
      </GistSync>
    </PinGate>
  )
}

export default App
