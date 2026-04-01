import { useState, useEffect } from 'react'
import { loadData, syncConfigured } from '../hooks/useSync.js'

// Loads latest data from JSONBin into localStorage before the app renders.
// If sync is not configured (local dev), renders children immediately.
export function GistSync({ children }) {
  const [ready, setReady] = useState(!syncConfigured)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!syncConfigured) return
    loadData()
      .then(data => {
        if (!data) return
        if (data.bills !== undefined)    localStorage.setItem('hf_bills',    JSON.stringify(data.bills))
        if (data.income !== undefined)   localStorage.setItem('hf_income',   JSON.stringify(data.income))
        if (data.payments !== undefined) localStorage.setItem('hf_payments', JSON.stringify(data.payments))
        if (data.incomeReceipts !== undefined) localStorage.setItem('hf_income_receipts', JSON.stringify(data.incomeReceipts))
        if (data.settings && Object.keys(data.settings).length)
                                         localStorage.setItem('hf_settings', JSON.stringify(data.settings))
        if (data.profileImage)           localStorage.setItem('hf_profile_image', data.profileImage)
        else                             localStorage.removeItem('hf_profile_image')
      })
      .catch(e => setError(e.message))
      .finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="min-h-svh bg-slate-900 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Syncing data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-svh bg-slate-900 flex flex-col items-center justify-center gap-4 p-8">
        <div className="text-4xl">⚠️</div>
        <p className="text-red-400 text-center text-sm">{error}</p>
        <button
          onClick={() => setReady(true)}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm"
        >Continue offline</button>
      </div>
    )
  }

  return children
}
