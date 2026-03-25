import { useState } from 'react'
import { FinanceProvider } from './context/FinanceContext.jsx'
import { BottomNav } from './components/layout/BottomNav.jsx'
import { PinGate } from './components/PinGate.jsx'
import { GistSync } from './components/GistSync.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { BillsPage } from './pages/BillsPage.jsx'
import { IncomePage } from './pages/IncomePage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'

function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <PinGate>
      <GistSync>
      <FinanceProvider>
        <div className="flex flex-col min-h-svh bg-slate-900 pb-16">
          {page === 'dashboard' && <DashboardPage />}
          {page === 'bills'     && <BillsPage />}
          {page === 'income'    && <IncomePage />}
          {page === 'settings'  && <SettingsPage />}
        </div>
        <BottomNav active={page} onSelect={setPage} />
      </FinanceProvider>
      </GistSync>
    </PinGate>
  )
}

export default App
