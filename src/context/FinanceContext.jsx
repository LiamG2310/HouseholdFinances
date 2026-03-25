import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useBills } from '../hooks/useBills.js'
import { useIncome } from '../hooks/useIncome.js'
import { useSettings } from '../hooks/useSettings.js'
import { saveData, syncConfigured } from '../hooks/useSync.js'
import { formatCurrency } from '../utils/currencyUtils.js'

const FinanceContext = createContext(null)

export function FinanceProvider({ children }) {
  const billsApi = useBills()
  const incomeApi = useIncome()
  const settingsApi = useSettings()
  const [syncStatus, setSyncStatus] = useState('idle') // idle | saving | saved | error
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem('hf_profile_image') || null)
  const hasMounted = useRef(false)
  const saveTimer = useRef(null)

  const updateProfileImage = (dataUrl) => {
    if (dataUrl) {
      localStorage.setItem('hf_profile_image', dataUrl)
    } else {
      localStorage.removeItem('hf_profile_image')
    }
    setProfileImage(dataUrl || null)
  }

  useEffect(() => {
    // Skip the initial mount — only save on subsequent changes
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    if (!syncConfigured) return

    setSyncStatus('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveData({
        settings: settingsApi.settings,
        bills: billsApi.bills,
        income: incomeApi.incomes,
        payments: billsApi.payments,
        profileImage: localStorage.getItem('hf_profile_image') || null,
      })
        .then(() => {
          setSyncStatus('saved')
          setTimeout(() => setSyncStatus('idle'), 2000)
        })
        .catch(() => setSyncStatus('error'))
    }, 1500)
  }, [billsApi.bills, billsApi.payments, incomeApi.incomes, settingsApi.settings, profileImage])

  const fmt = (amount) => formatCurrency(amount, settingsApi.settings.currency)

  return (
    <FinanceContext.Provider value={{ ...billsApi, ...incomeApi, ...settingsApi, fmt, syncStatus, profileImage, updateProfileImage }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}
