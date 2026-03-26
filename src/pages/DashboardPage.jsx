import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useFinance } from '../context/FinanceContext.jsx'
import { monthLabel, daysUntil, formatShortDate } from '../utils/dateUtils.js'
import { categoryIcon, CATEGORIES, isBillAtRisk } from '../utils/billUtils.js'

const card = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

export function DashboardPage() {
  const { monthlyTotal, monthlyByPerson, getBillsMonth, isPaid, markPaid, markUnpaid, fmt, settings, profileImage, refresh, truelayer, syncTruelayer, pendingMatches, confirmMatch, dismissMatch, incomes } = useFinance()
  const [annual, setAnnual] = useState(false)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const mk = `${year}-${String(month).padStart(2, '0')}`
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysLeft = daysInMonth - now.getDate()

  const monthBills = useMemo(() => getBillsMonth(year, month), [getBillsMonth, year, month])

  const annualBillsTotal = useMemo(() => {
    let total = 0
    for (let m = 1; m <= 12; m++) {
      total += getBillsMonth(year, m).reduce((s, { bill }) => s + bill.amount, 0)
    }
    return total
  }, [getBillsMonth, year])

  const totalBills = monthBills.reduce((s, { bill }) => s + bill.amount, 0)
  const paidBills = monthBills.filter(({ bill }) => isPaid(bill.id, mk))
  const unpaidBills = monthBills.filter(({ bill }) => !isPaid(bill.id, mk))
  const paidTotal = paidBills.reduce((s, { bill }) => s + bill.amount, 0)
  const remainingBills = totalBills - paidTotal

  const displayIncome = annual ? monthlyTotal * 12 : monthlyTotal
  const displayBills  = annual ? annualBillsTotal : totalBills
  const balance = displayIncome - displayBills
  const leftover = balance
  const isShortfall = balance < 0
  const isWarning = !isShortfall && displayIncome > 0 && balance < displayIncome * 0.1

  const overdue = unpaidBills.filter(({ dueDate }) => daysUntil(dueDate) < 0)
  const upcoming = unpaidBills.filter(({ dueDate }) => {
    const d = daysUntil(dueDate)
    return d >= 0 && d <= 7
  })

  // Category spending breakdown (unpaid only)
  const categoryTotals = CATEGORIES.map(cat => ({
    ...cat,
    total: unpaidBills
      .filter(({ bill }) => bill.category === cat.value)
      .reduce((s, { bill }) => s + bill.amount, 0),
  })).filter(c => c.total > 0)

  const isConnectedWithBalance = truelayer.status === 'connected' && truelayer.data?.accounts?.[0]?.balance
  const bankBalance = isConnectedWithBalance ? truelayer.data.accounts[0].balance.current : null
  const afterBills = isConnectedWithBalance ? bankBalance - remainingBills : null

  const statusColor = isShortfall ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-green-400'
  const statusBg = truelayer.status === 'loading'
    ? 'from-indigo-950 to-slate-900'
    : isConnectedWithBalance
      ? (afterBills < 0 ? 'from-red-950 to-slate-900' : afterBills < bankBalance * 0.1 ? 'from-amber-950 to-slate-900' : 'from-indigo-950 to-slate-900')
      : (isShortfall ? 'from-red-950 to-slate-900' : isWarning ? 'from-amber-950 to-slate-900' : 'from-indigo-950 to-slate-900')
  const paidPct = monthBills.length ? (paidBills.length / monthBills.length) * 100 : 0

  return (
    <div className="flex-1 overflow-y-auto pb-24">

      {/* Hero card */}
      <div className={`bg-gradient-to-b ${statusBg} px-4 pt-6 pb-8`}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {profileImage && (
                <div className="relative flex-shrink-0" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <img src={profileImage} alt="" className="w-full h-full object-cover rounded-full block" />
                  <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 8px 4px rgba(0,0,0,0.4)' }} />
                </div>
              )}
              <div>
                <p className="text-slate-400 text-sm">{annual ? String(year) : monthLabel()}</p>
                <h1 className="text-white text-xl font-bold">Overview</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refresh}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 bg-opacity-50 text-slate-400 hover:text-white text-lg"
              >↻</button>
              {!annual && (
                <div className="text-right mr-1">
                  <p className="text-slate-400 text-xs">{daysLeft} days left</p>
                  <p className="text-slate-300 text-sm">in month</p>
                </div>
              )}
              <div
                className="flex bg-slate-800 bg-opacity-50 rounded-lg p-0.5 text-xs cursor-pointer"
                onClick={() => setAnnual(a => !a)}
              >
                <div className={`px-2.5 py-1 rounded-md font-medium transition-colors ${!annual ? 'bg-white bg-opacity-20 text-white' : 'text-slate-400'}`}>Mo</div>
                <div className={`px-2.5 py-1 rounded-md font-medium transition-colors ${annual ? 'bg-white bg-opacity-20 text-white' : 'text-slate-400'}`}>Yr</div>
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="text-center py-4">
            {truelayer.status === 'loading' ? (
              <div className="flex items-center justify-center h-20">
                <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : isConnectedWithBalance ? (
              <>
                <p className="text-slate-400 text-sm mb-1">Current balance</p>
                <p className="text-5xl font-bold text-white">{fmt(bankBalance)}</p>
                <p className="text-slate-400 text-sm mt-3 mb-0.5">After upcoming bills</p>
                <p className={`text-2xl font-semibold ${afterBills < 0 ? 'text-red-400' : afterBills < bankBalance * 0.1 ? 'text-amber-400' : 'text-green-400'}`}>{fmt(afterBills)}</p>
                {afterBills < 0 && <p className="text-red-400 text-sm mt-1">Bills exceed balance by {fmt(Math.abs(afterBills))}</p>}
              </>
            ) : (
              <>
                <p className="text-slate-400 text-sm mb-1">
                  {isShortfall ? 'Shortfall this month' : 'Left after bills'}
                </p>
                <p className={`text-5xl font-bold ${statusColor}`}>{fmt(Math.abs(leftover))}</p>
                {isShortfall && <p className="text-red-400 text-sm mt-1">You're {fmt(Math.abs(balance))} short</p>}
                {isWarning && <p className="text-amber-400 text-sm mt-1">Tight month — less than 10% buffer</p>}
              </>
            )}
          </div>

          {/* Income vs Bills bar */}
          {displayIncome > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Bills {fmt(displayBills)}</span>
                <span>Income {fmt(displayIncome)}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isShortfall ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min((displayBills / displayIncome) * 100, 100)}%` }}
                />
              </div>
              <p className="text-center text-xs text-slate-500 mt-1">
                {Math.round((displayBills / displayIncome) * 100)}% of income goes to bills
              </p>
            </div>
          )}
        </div>
      </div>

      <motion.div
        className="max-w-lg mx-auto px-4 space-y-4 mt-4"
        variants={stagger}
        initial="hidden"
        animate="show"
      >

        {truelayer.status === 'expired' && (
          <div className="bg-amber-950 border border-amber-900 rounded-xl p-4">
            <p className="text-amber-400 text-sm">Bank connection expired — go to Settings to reconnect.</p>
          </div>
        )}

        {/* Pending bill-transaction matches requiring confirmation */}
        {pendingMatches.length > 0 && (
          <motion.div variants={card} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-amber-400 mb-3">⚠️ Possible bill payments — confirm?</h2>
            <div className="space-y-3">
              {pendingMatches.map(m => (
                <div key={m.transactionId} className="bg-slate-700 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{m.txDescription}</p>
                      <p className="text-slate-400 text-xs">{new Date(m.txDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {fmt(m.txAmount)}</p>
                    </div>
                    <span className="text-slate-500 text-xs flex-shrink-0">→</span>
                    <div className="min-w-0 text-right">
                      <p className="text-white text-sm font-medium truncate">{m.billName}</p>
                      <p className="text-slate-400 text-xs">{fmt(m.billAmount)} bill</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmMatch(m.billId, m.monthKey, m.billAmount, m.transactionId, m.txDescription)}
                      className="flex-1 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-white text-xs font-medium transition-colors"
                    >Yes, mark paid</button>
                    <button
                      onClick={() => dismissMatch(m.transactionId)}
                      className="flex-1 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-slate-300 text-xs font-medium transition-colors"
                    >Not this bill</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick stats row */}
        <motion.div variants={card} className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{paidBills.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">Paid</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{unpaidBills.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">Remaining</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{overdue.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">Overdue</p>
          </div>
        </motion.div>

        {/* Bills paid progress */}
        {monthBills.length > 0 && (
          <motion.div variants={card} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-300 font-medium">Bills paid this month</span>
              <span className="text-sm text-white font-semibold">{fmt(paidTotal)} <span className="text-slate-500 font-normal">of {fmt(totalBills)}</span></span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${paidPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{Math.round(paidPct)}% complete</span>
              <span>{fmt(remainingBills)} still to pay</span>
            </div>
          </motion.div>
        )}

        {/* Per-person income */}
        {monthlyTotal > 0 && (
          <motion.div variants={card} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h2 className="text-sm font-medium text-slate-400 mb-3">Household Income</h2>
            <div className="space-y-2">
              {[
                { name: settings.person1Name, amount: annual ? monthlyByPerson('person1') * 12 : monthlyByPerson('person1') },
                { name: settings.person2Name, amount: annual ? monthlyByPerson('person2') * 12 : monthlyByPerson('person2') },
              ].filter(p => p.amount > 0).map(p => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-slate-300 text-sm w-24 truncate">{p.name}</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${(p.amount / displayIncome) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-medium w-20 text-right">{fmt(p.amount)}</span>
                </div>
              ))}
              <div className="border-t border-slate-700 pt-2 flex justify-between">
                <span className="text-slate-400 text-sm">Combined</span>
                <span className="text-green-400 font-semibold">{fmt(displayIncome)}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Overdue */}
        {overdue.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-red-400 mb-2">⚠️ Overdue</h2>
            <div className="space-y-2">
              {overdue.map(({ bill, dueDate }) => (
                <div key={bill.id} className="flex items-center gap-3 bg-red-950 border border-red-900 rounded-xl p-3">
                  <button
                    onClick={() => markPaid(bill.id, mk, 'joint', bill.amount)}
                    className="w-6 h-6 rounded-full border-2 border-red-500 flex-shrink-0"
                  />
                  <span className="text-xl">{categoryIcon(bill.category)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{bill.name}</p>
                    <p className="text-red-400 text-xs">{formatShortDate(dueDate)}</p>
                  </div>
                  {isBillAtRisk(dueDate, incomes, monthBills) && (
                    <span className="text-amber-400 text-xs">⚡</span>
                  )}
                  <span className="text-white font-semibold">{fmt(bill.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-300 mb-2">Due this week</h2>
            <div className="space-y-2">
              {upcoming.map(({ bill, dueDate }) => {
                const days = daysUntil(dueDate)
                const atRisk = isBillAtRisk(dueDate, incomes, monthBills)
                return (
                  <div key={bill.id} className={`flex items-center gap-3 rounded-xl p-3 border ${atRisk ? 'bg-amber-950 border-amber-800' : 'bg-slate-800 border-slate-700'}`}>
                    <button
                      onClick={() => markPaid(bill.id, mk, 'joint', bill.amount)}
                      className="w-6 h-6 rounded-full border-2 border-slate-500 flex-shrink-0 hover:border-green-500 transition-colors"
                    />
                    <span className="text-xl">{categoryIcon(bill.category)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{bill.name}</p>
                      <p className={`text-xs ${atRisk ? 'text-amber-400' : 'text-slate-400'}`}>
                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`} · {formatShortDate(dueDate)}
                        {atRisk && ' · ⚡ Income may not arrive in time'}
                      </p>
                    </div>
                    <span className="text-white font-semibold">{fmt(bill.amount)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {categoryTotals.length > 0 && (
          <motion.div variants={card} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h2 className="text-sm font-medium text-slate-400 mb-3">Remaining by category</h2>
            <div className="space-y-2">
              {categoryTotals.map(cat => (
                <div key={cat.value} className="flex items-center gap-3">
                  <span className="text-lg w-6">{cat.icon}</span>
                  <span className="text-slate-300 text-sm flex-1">{cat.label}</span>
                  <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full"
                      style={{ width: `${remainingBills > 0 ? (cat.total / remainingBills) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-medium w-16 text-right">{fmt(cat.total)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {monthBills.length === 0 && monthlyTotal === 0 && (
          <div className="text-center py-16">
            {profileImage ? (
              <div className="relative mx-auto mb-3" style={{ width: '5rem', height: '5rem' }}>
                <img src={profileImage} alt="" className="w-full h-full object-cover rounded-full block" />
                <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 18px 10px rgba(0,0,0,0.45)' }} />
              </div>
            ) : (
              <div className="text-5xl mb-3">🏠</div>
            )}
            <p className="text-slate-400">Add your income and bills to get started</p>
          </div>
        )}

      </motion.div>
    </div>
  )
}
