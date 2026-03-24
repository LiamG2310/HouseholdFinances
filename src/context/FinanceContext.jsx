import { createContext, useContext } from 'react'
import { useBills } from '../hooks/useBills.js'
import { useIncome } from '../hooks/useIncome.js'
import { useSettings } from '../hooks/useSettings.js'
import { formatCurrency } from '../utils/currencyUtils.js'

const FinanceContext = createContext(null)

export function FinanceProvider({ children }) {
  const billsApi = useBills()
  const incomeApi = useIncome()
  const settingsApi = useSettings()

  const fmt = (amount) => formatCurrency(amount, settingsApi.settings.currency)

  return (
    <FinanceContext.Provider value={{ ...billsApi, ...incomeApi, ...settingsApi, fmt }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}
