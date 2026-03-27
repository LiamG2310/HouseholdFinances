import { useState, useEffect, useCallback, useRef } from 'react'
import { useFinance } from '../context/FinanceContext.jsx'
import { authHeaders } from '../hooks/useSync.js'
import { monthLabel } from '../utils/dateUtils.js'

function normalise(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
}

function nameScore(billName, txDescription) {
  const billNorm = normalise(billName)
  const txNorm = normalise(txDescription)

  // Direct: the full bill name appears in the transaction description
  if (txNorm.includes(billNorm)) return 1

  // Word-level: filter stop words but keep short names (EE, BT, O2 etc.)
  const stopWords = new Set(['and', 'the', 'for', 'ltd', 'plc', 'llp', 'limited'])
  const words = billNorm.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w))
  if (!words.length) return 0
  const matched = words.filter(w => txNorm.includes(w)).length
  return matched / words.length
}

function categoryIcon(category) {
  const map = {
    PURCHASE: '🛍️', ATM: '🏧', TRANSFER: '↔️', DIRECT_DEBIT: '📋',
    STANDING_ORDER: '🔁', CREDIT: '💰', INTEREST: '📈', FEE: '💸',
    DEBIT: '💳',
  }
  return map[category] || '💳'
}

const CATEGORY_LABELS = {
  PURCHASE: { label: 'Purchase', icon: '🛍️' },
  ATM: { label: 'ATM', icon: '🏧' },
  TRANSFER: { label: 'Transfer', icon: '↔️' },
  DIRECT_DEBIT: { label: 'Direct Debit', icon: '📋' },
  STANDING_ORDER: { label: 'Standing Order', icon: '🔁' },
  CREDIT: { label: 'Credit', icon: '💰' },
  INTEREST: { label: 'Interest', icon: '📈' },
  FEE: { label: 'Fee', icon: '💸' },
  DEBIT: { label: 'Debit', icon: '💳' },
}

export function TransactionsPage() {
  const { truelayer, fmt, refresh, getBillsMonth, isPaid, markPaid, setPendingMatches, learnedLinks } = useFinance()
  const now = new Date()
  const [viewYear, setViewYear]   = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)
  const [transactions, setTransactions] = useState([])
  const processedMonthRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(null)

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

  const load = useCallback((bust = false) => {
    if (truelayer.status !== 'connected') return
    setLoading(true)
    setError(null)
    const qs = `year=${viewYear}&month=${viewMonth}${bust ? '&refresh=true' : ''}`
    fetch(`/api/truelayer/transactions?${qs}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(({ transactions, error }) => {
        if (error) { setError(error); return }
        setTransactions(transactions || [])
      })
      .catch(() => setError('Failed to load transactions'))
      .finally(() => setLoading(false))
  }, [truelayer.status, viewYear, viewMonth])

  useEffect(() => { load() }, [load])

  // Auto-match transactions against bills for the current month
  useEffect(() => {
    const curYear = now.getFullYear()
    const curMonth = now.getMonth() + 1
    if (viewYear !== curYear || viewMonth !== curMonth) return
    if (transactions.length === 0) return

    // Only process once per month load to avoid repeated marking
    const monthKey = `${viewYear}-${String(viewMonth).padStart(2, '0')}`
    if (processedMonthRef.current === monthKey) return
    processedMonthRef.current = monthKey

    const monthBills = getBillsMonth(curYear, curMonth)
    const autoMatched = new Set()
    const fuzzyMatches = []
    const queuedTxIds = new Set()

    for (const tx of transactions) {
      if (tx.amount >= 0) continue
      const absAmt = Math.abs(tx.amount)
      const txKey = tx.description.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()

      // Pass 1: learned link — previously confirmed pairing
      const learntBillId = learnedLinks[txKey]
      if (learntBillId) {
        const learntEntry = monthBills.find(({ bill }) => bill.id === learntBillId)
        if (learntEntry && !isPaid(learntBillId, monthKey) && !autoMatched.has(learntBillId)) {
          const amtDiff = Math.abs(absAmt - learntEntry.bill.amount) / learntEntry.bill.amount
          if (amtDiff <= 0.25) {
            markPaid(learntBillId, monthKey, 'joint', learntEntry.bill.amount)
            autoMatched.add(learntBillId)
            queuedTxIds.add(tx.id)
            continue
          }
        }
      }

      // Pass 2: name/amount matching
      for (const { bill } of monthBills) {
        if (isPaid(bill.id, monthKey)) continue
        if (autoMatched.has(bill.id)) continue
        if (queuedTxIds.has(tx.id)) break

        const amtDiff = Math.abs(absAmt - bill.amount) / bill.amount
        const score = Math.max(
          nameScore(bill.name, tx.description),
          bill.notes ? nameScore(bill.notes, tx.description) : 0,
        )

        // Auto-match: amount within 2% AND strong name/notes match
        if (amtDiff <= 0.02 && score >= 0.5) {
          markPaid(bill.id, monthKey, 'joint', bill.amount)
          autoMatched.add(bill.id)
          queuedTxIds.add(tx.id)
          break
        }

        // Fuzzy: show on dashboard if amount within 30% OR any name overlap
        const fuzzy = (amtDiff <= 0.30 && score > 0) || (amtDiff <= 0.05) || (score >= 0.5)
        if (fuzzy && !autoMatched.has(bill.id)) {
          fuzzyMatches.push({
            transactionId: tx.id,
            billId: bill.id,
            billName: bill.name,
            billAmount: bill.amount,
            txDescription: tx.description,
            txAmount: absAmt,
            txDate: tx.date,
            monthKey,
          })
          queuedTxIds.add(tx.id)
          break
        }
      }
    }

    if (fuzzyMatches.length > 0) {
      setPendingMatches(prev => {
        const existingIds = new Set(prev.map(m => m.transactionId))
        return [...prev, ...fuzzyMatches.filter(m => !existingIds.has(m.transactionId))]
      })
    }
  }, [transactions, viewYear, viewMonth])

  // Reset filters when month changes
  useEffect(() => { setSearch(''); setCategoryFilter(null) }, [viewYear, viewMonth])

  const sorted = transactions.slice().sort((a, b) => new Date(b.date) - new Date(a.date))

  const visible = sorted.filter(t => {
    if (categoryFilter && t.category !== categoryFilter) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      if (!t.description.toLowerCase().includes(q)) return false
    }
    return true
  })

  const availableCategories = [...new Set(sorted.map(t => t.category).filter(Boolean))]

  const isFiltering = search.trim() || categoryFilter
  const totalIn  = visible.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalOut = visible.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)

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
            onClick={() => { processedMonthRef.current = null; load(true) }}
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

        {/* Search */}
        {transactions.length > 0 && (
          <div className="px-4 mb-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search transactions…"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-lg leading-none"
                >×</button>
              )}
            </div>
          </div>
        )}

        {/* Category filter pills */}
        {availableCategories.length > 0 && (
          <div className="flex gap-2 px-4 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setCategoryFilter(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!categoryFilter ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >All</button>
            {availableCategories.map(cat => {
              const meta = CATEGORY_LABELS[cat] || { label: cat, icon: '💳' }
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(c => c === cat ? null : cat)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${categoryFilter === cat ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  <span>{meta.icon}</span>{meta.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Summary bar */}
        {transactions.length > 0 && (
          <div className="mx-4 mb-3 grid grid-cols-2 gap-3">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">{isFiltering ? 'Filtered in' : 'Money in'}</p>
              <p className="text-green-400 font-semibold">{fmt(totalIn)}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">{isFiltering ? 'Filtered out' : 'Money out'}</p>
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
          {!loading && !error && transactions.length > 0 && visible.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">No transactions match your search</p>
              <button onClick={() => { setSearch(''); setCategoryFilter(null) }} className="mt-2 text-indigo-400 text-sm">Clear filters</button>
            </div>
          )}
          {!loading && !error && visible.map(t => (
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
          ))}
        </div>

      </div>
    </div>
  )
}
