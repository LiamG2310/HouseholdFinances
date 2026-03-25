import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useBills } from '../hooks/useBills.js'
import { useIncome } from '../hooks/useIncome.js'
import { useSettings } from '../hooks/useSettings.js'
import { useGist } from '../hooks/useGist.js'
import { formatCurrency } from '../utils/currencyUtils.js'

const FinanceContext = createContext(null)

export function FinanceProvider({ children }) {
  const billsApi = useBills()
  const incomeApi = useIncome()
  const settingsApi = useSettings()
  const { pat, gistId, saveGist } = useGist()
  const [syncStatus, setSyncStatus] = useState('idle') // idle | saving | saved | error
  const hasMounted = useRef(false)
  const saveTimer = useRef(null)

  useEffect(() => {
    // Skip the initial mount — only save on subsequent changes
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    if (!pat || !gistId) return

    setSyncStatus('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveGist({
        settings: settingsApi.settings,
        bills: billsApi.bills,
        income: incomeApi.incomes,
        payments: billsApi.payments,
      })
        .then(() => {
          setSyncStatus('saved')
          setTimeout(() => setSyncStatus('idle'), 2000)
        })
        .catch(() => setSyncStatus('error'))
    }, 1500)
  }, [billsApi.bills, billsApi.payments, incomeApi.incomes, settingsApi.settings])

  const fmt = (amount) => formatCurrency(amount, settingsApi.settings.currency)

  return (
    <FinanceContext.Provider value={{ ...billsApi, ...incomeApi, ...settingsApi, fmt, syncStatus }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}
