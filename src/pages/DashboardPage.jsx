import { useMemo } from 'react'
import { useFinance } from '../context/FinanceContext.jsx'
import { getBillsForMonth } from '../utils/billUtils.js'
import { monthLabel, daysUntil } from '../utils/dateUtils.js'
import { categoryIcon } from '../utils/billUtils.js'
import { formatShortDate } from '../utils/dateUtils.js'

export function DashboardPage() {
  const { bills, monthlyTotal, getBillsMonth, isPaid, fmt, settings } = useFinance()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const mk = `${year}-${String(month).padStart(2, '0')}`

  const monthBills = useMemo(() => getBillsMonth(year, month), [getBillsMonth, year, month])

  const totalBills = monthBills.reduce((s, { bill }) => s + bill.amount, 0)
  const paidTotal = monthBills
    .filter(({ bill }) => isPaid(bill.id, mk))
    .reduce((s, { bill }) => s + bill.amount, 0)
  const remainingBills = totalBills - paidTotal

  const balance = monthlyTotal - totalBills
  const isShortfall = balance < 0
  const isWarning = !isShortfall && monthlyTotal > 0 && balance < monthlyTotal * 0.1

  const upcoming = monthBills.filter(({ bill, dueDate }) => {
    const days = daysUntil(dueDate)
    return !isPaid(bill.id, mk) && days >= 0 && days <= 7
  })

  const overdue = monthBills.filter(({ bill, dueDate }) => {
    return !isPaid(bill.id, mk) && daysUntil(dueDate) < 0
  })

  return (
    <div className="flex-1 p-4 space-y-4 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Overview</h1>
        <span className="text-slate-400 text-sm">{monthLabel()}</span>
      </div>

      {/* Alert banner */}
      {(isShortfall || isWarning || overdue.length > 0) && (
        <div className={`rounded-xl p-4 ${isShortfall ? 'bg-red-950 border border-red-800' : overdue.length > 0 ? 'bg-red-950 border border-red-800' : 'bg-amber-950 border border-amber-800'}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{isShortfall || overdue.length > 0 ? '⚠️' : '⚡'}</span>
            <div>
              {isShortfall && (
                <p className="text-red-300 font-semibold">Shortfall of {fmt(Math.abs(balance))} this month</p>
              )}
              {isWarning && !isShortfall && (
                <p className="text-amber-300 font-semibold">Tight month — only {fmt(balance)} left after bills</p>
              )}
              {overdue.length > 0 && (
                <p className="text-red-300 text-sm mt-1">{overdue.length} bill{overdue.length > 1 ? 's' : ''} overdue</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Month summary */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <h2 className="text-sm font-medium text-slate-400 mb-3">This Month</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-300">Combined income</span>
            <span className="text-green-400 font-semibold">{fmt(monthlyTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Total bills</span>
            <span className="text-white font-semibold">{fmt(totalBills)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Still to pay</span>
            <span className="text-amber-300 font-semibold">{fmt(remainingBills)}</span>
          </div>
          <div className="border-t border-slate-700 pt-2 flex justify-between">
            <span className="text-slate-300 font-medium">Balance</span>
            <span className={`font-bold text-lg ${isShortfall ? 'text-red-400' : 'text-green-400'}`}>
              {fmt(balance)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {monthBills.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Bills paid</span>
            <span className="text-slate-300">{monthBills.filter(({ bill }) => isPaid(bill.id, mk)).length} / {monthBills.length}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${monthBills.length ? (monthBills.filter(({ bill }) => isPaid(bill.id, mk)).length / monthBills.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Upcoming bills */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-400 mb-2">Due within 7 days</h2>
          <div className="space-y-2">
            {upcoming.map(({ bill, dueDate }) => (
              <div key={bill.id} className="flex items-center gap-3 bg-amber-950 border border-amber-900 rounded-xl p-3">
                <span className="text-xl">{categoryIcon(bill.category)}</span>
                <div className="flex-1">
                  <div className="text-white font-medium">{bill.name}</div>
                  <div className="text-amber-400 text-sm">{formatShortDate(dueDate)}</div>
                </div>
                <span className="text-white font-semibold">{fmt(bill.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-red-400 mb-2">Overdue</h2>
          <div className="space-y-2">
            {overdue.map(({ bill, dueDate }) => (
              <div key={bill.id} className="flex items-center gap-3 bg-red-950 border border-red-900 rounded-xl p-3">
                <span className="text-xl">{categoryIcon(bill.category)}</span>
                <div className="flex-1">
                  <div className="text-white font-medium">{bill.name}</div>
                  <div className="text-red-400 text-sm">{formatShortDate(dueDate)}</div>
                </div>
                <span className="text-white font-semibold">{fmt(bill.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {monthBills.length === 0 && monthlyTotal === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🏠</div>
          <p className="text-slate-400">Add your income and bills to get started</p>
        </div>
      )}
    </div>
  )
}
