import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useBills } from '../hooks/useBills.js'
import { useIncome } from '../hooks/useIncome.js'
import { useSettings } from '../hooks/useSettings.js'
import { saveData, syncConfigured, USE_API, authHeaders } from '../hooks/useSync.js'
import { formatCurrency } from '../utils/currencyUtils.js'

const FinanceContext = createContext(null)

export function FinanceProvider({ children }) {
  const billsApi = useBills()
  const incomeApi = useIncome()
  const settingsApi = useSettings()
  const [syncStatus, setSyncStatus] = useState('idle') // idle | saving | saved | error
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem('hf_profile_image') || null)
  const [truelayer, setTruelayer] = useState({ status: 'loading', data: null, connectedAt: null })
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

  // Load TrueLayer status on mount
  useEffect(() => {
    if (!USE_API) { setTruelayer({ status: 'idle', data: null, connectedAt: null }); return }
    fetch('/api/truelayer/status', { headers: authHeaders() })
      .then(r => r.json())
      .then(({ connected, expired, bankData, connectedAt }) => {
        setTruelayer({
          status: connected ? 'connected' : expired ? 'expired' : 'disconnected',
          data: bankData || null,
          connectedAt: connectedAt || null,
        })
      })
      .catch(() => setTruelayer({ status: 'disconnected', data: null, connectedAt: null }))
  }, [])

  const connectTruelayer = async () => {
    const res = await fetch('/api/truelayer/connect', { headers: authHeaders() })
    const { url } = await res.json()
    window.location.href = url
  }

  const syncTruelayer = async () => {
    const res = await fetch('/api/truelayer/sync', { method: 'POST', headers: authHeaders() })
    if (!res.ok) return
    const { bankData } = await res.json()
    setTruelayer(prev => ({ ...prev, data: bankData }))
  }

  const disconnectTruelayer = async () => {
    await fetch('/api/truelayer/disconnect', { method: 'POST', headers: authHeaders() })
    setTruelayer({ status: 'disconnected', data: null, connectedAt: null })
  }

  const syncRecurring = async () => {
    const res = await fetch('/api/truelayer/recurring', { headers: authHeaders() })
    if (!res.ok) return { added: 0 }
    const { directDebits, standingOrders } = await res.json()

    let added = 0
    const all = [
      ...directDebits.map(d => ({ ...d, source: 'direct_debit' })),
      ...standingOrders.map(s => ({ ...s, source: 'standing_order' })),
    ]

    for (const item of all) {
      if (billsApi.bills.some(b => b.tlId === item.id)) continue
      billsApi.addBill({
        name: item.name,
        amount: item.amount || 0,
        needsAmount: !item.amount,
        category: item.source === 'standing_order' ? 'housing' : 'subscriptions',
        frequency: item.frequency,
        dayOfMonth: 1,
        activeMonths: [],
        assignedTo: 'joint',
        notes: '',
        source: item.source,
        tlId: item.id,
      })
      added++
    }
    return { added }
  }

  // Pending bill-transaction matches requiring user confirmation
  const [pendingMatches, setPendingMatches] = useState([])

  const confirmMatch = (billId, monthKey, amount, transactionId) => {
    billsApi.markPaid(billId, monthKey, 'joint', amount)
    setPendingMatches(prev => prev.filter(m => m.transactionId !== transactionId))
  }

  const dismissMatch = (transactionId) => {
    setPendingMatches(prev => prev.filter(m => m.transactionId !== transactionId))
  }

  const fmt = (amount) => formatCurrency(amount, settingsApi.settings.currency)

  return (
    <FinanceContext.Provider value={{ ...billsApi, ...incomeApi, ...settingsApi, fmt, syncStatus, profileImage, updateProfileImage, refresh: () => window.location.reload(), truelayer, connectTruelayer, syncTruelayer, disconnectTruelayer, syncRecurring, pendingMatches, setPendingMatches, confirmMatch, dismissMatch }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}
