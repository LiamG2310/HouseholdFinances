import { useState, useEffect, useCallback } from 'react'
import { useFinance } from '../context/FinanceContext.jsx'
import { authHeaders } from '../hooks/useSync.js'
import { monthLabel } from '../utils/dateUtils.js'

function categoryIcon(category) {
  const map = {
    PURCHASE: '🛍️', ATM: '🏧', TRANSFER: '↔️', DIRECT_DEBIT: '📋',
    STANDING_ORDER: '🔁', CREDIT: '💰', INTEREST: '📈', FEE: '💸',
    DEBIT: '💳',
  }
  return map[category] || '💳'
}

export function TransactionsPage() {
  const { truelayer, fmt, refresh } = useFinance()
  const now = new Date()
  const [viewYear, setViewYear]   = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (isCurrentMonth) return
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1) }
    else setViewMonth(m => m + 1)
  }

  const load = useCallback(() => {
    if (truelayer.status !== 'connected') return
    setLoading(true)
    setError(null)
    fetch(`/api/truelayer/transactions?year=${viewYear}&month=${viewMonth}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(({ transactions, error }) => {
        if (error) { setError(error); return }
        setTransactions(transactions || [])
      })
      .catch(() => setError('Failed to load transactions'))
      .finally(() => setLoading(false))
  }, [truelayer.status, viewYear, viewMonth])

  useEffect(() => { load() }, [load])

  const totalIn  = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)

  if (truelayer.status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (truelayer.status !== 'connected') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="text-5xl">🏦</span>
        <p className="text-white font-semibold">No bank connected</p>
        <p className="text-slate-400 text-sm">Connect your bank in Settings to see transactions</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto w-full">

        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Transactions</h1>
          <button
            onClick={refresh}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white text-lg"
          >↻</button>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between px-4 mb-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white text-lg"
          >‹</button>
          <span className="text-sm font-medium text-white">
            {monthLabel(new Date(viewYear, viewMonth - 1, 1))}
          </span>
          <button
            onClick={nextMonth}
            className={`w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-lg transition-colors ${isCurrentMonth ? 'text-slate-700 cursor-default' : 'text-slate-400 hover:text-white'}`}
          >›</button>
        </div>

        {/* Summary bar */}
        {transactions.length > 0 && (
          <div className="mx-4 mb-3 grid grid-cols-2 gap-3">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Money in</p>
              <p className="text-green-400 font-semibold">{fmt(totalIn)}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Money out</p>
              <p className="text-red-400 font-semibold">{fmt(Math.abs(totalOut))}</p>
            </div>
          </div>
        )}

        {/* List */}
        <div className="px-4 pb-24 space-y-2">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && error && (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm">{error}</p>
              <button onClick={load} className="mt-3 text-indigo-400 text-sm">Try again</button>
            </div>
          )}
          {!loading && !error && transactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">No transactions this month</p>
            </div>
          )}
          {!loading && !error && transactions
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(t => (
              <div key={t.id} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-3">
                <span className="text-xl flex-shrink-0">{categoryIcon(t.category)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{t.description}</p>
                  <p className="text-slate-500 text-xs">
                    {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span className={`font-semibold text-sm flex-shrink-0 ${t.amount >= 0 ? 'text-green-400' : 'text-white'}`}>
                  {t.amount >= 0 ? '+' : ''}{fmt(t.amount)}
                </span>
              </div>
            ))
          }
        </div>

      </div>
    </div>
  )
}
