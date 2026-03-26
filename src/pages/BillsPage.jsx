import { useState, useMemo, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useFinance } from '../context/FinanceContext.jsx'
import { BillCard } from '../components/bills/BillCard.jsx'
import { BillForm } from '../components/bills/BillForm.jsx'
import { EmptyState } from '../components/shared/EmptyState.jsx'
import { UndoToast } from '../components/shared/UndoToast.jsx'
import { monthLabel } from '../utils/dateUtils.js'
import { isBillAtRisk } from '../utils/billUtils.js'

export function BillsPage() {
  const { bills, addBill, updateBill, deleteBill, restoreBill, getBillsMonth, isPaid, markPaid, markUnpaid, fmt, settings, refresh, truelayer, syncRecurring, incomes } = useFinance()
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  const handleSyncFromBank = async () => {
    setSyncing(true)
    setSyncResult(null)
    const { added } = await syncRecurring()
    setSyncing(false)
    setSyncResult(added)
    setTimeout(() => setSyncResult(null), 4000)
  }
  const [showForm, setShowForm] = useState(false)
  const [editBill, setEditBill] = useState(null)
  const [tab, setTab] = useState('month')

  // Month navigation
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === (now.getMonth() + 1)
  const mk = `${viewYear}-${String(viewMonth).padStart(2, '0')}`

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (isCurrentMonth) return
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1) }
    else setViewMonth(m => m + 1)
  }

  // Undo delete
  const [undoItem, setUndoItem] = useState(null)
  const undoTimerRef = useRef(null)

  const handleDelete = (bill) => {
    const deleted = deleteBill(bill.id)
    setUndoItem(deleted)
    clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => setUndoItem(null), 5000)
  }

  const handleUndo = () => {
    clearTimeout(undoTimerRef.current)
    restoreBill(undoItem)
    setUndoItem(null)
  }

  const monthBills = useMemo(() => getBillsMonth(viewYear, viewMonth), [getBillsMonth, viewYear, viewMonth])

  const handleSave = (data) => {
    if (editBill) updateBill(editBill.id, { ...data, needsAmount: false })
    else addBill(data)
    setShowForm(false)
    setEditBill(null)
  }

  const handleEdit = (bill) => { setEditBill(bill); setShowForm(true) }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto w-full">
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Bills</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white text-lg"
          >↻</button>
          {truelayer.status === 'connected' && (
            <button
              onClick={handleSyncFromBank}
              disabled={syncing}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >{syncing ? 'Syncing…' : syncResult !== null ? `+${syncResult} added` : 'Sync from bank'}</button>
          )}
          <button
            onClick={() => { setEditBill(null); setShowForm(true) }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >+ Add</button>
        </div>
      </div>

      <div className="flex px-4 gap-2 mb-3">
        <button
          onClick={() => setTab('month')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'month' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
        >This Month</button>
        <button
          onClick={() => setTab('all')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
        >All Bills</button>
      </div>

      {/* Month navigation (only on month tab) */}
      {tab === 'month' && (
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
      )}

      <div className="px-4 pb-24 space-y-2">
        {tab === 'month' && (
          monthBills.length === 0
            ? <EmptyState icon="📅" message="No bills due this month" />
            : monthBills.map(({ bill, dueDate }) => (
              <BillCard
                key={bill.id}
                bill={bill}
                dueDate={dueDate}
                paid={isPaid(bill.id, mk)}
                atRisk={!isPaid(bill.id, mk) && isBillAtRisk(dueDate, incomes, monthBills)}
                onTogglePaid={() => isPaid(bill.id, mk) ? markUnpaid(bill.id, mk) : markPaid(bill.id, mk, 'joint', bill.amount)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                fmt={fmt}
              />
            ))
        )}

        {tab === 'all' && (
          bills.length === 0
            ? <EmptyState
                icon="📋"
                message="No bills yet"
                action={
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm"
                  >Add your first bill</button>
                }
              />
            : bills.map(bill => (
              <BillCard
                key={bill.id}
                bill={bill}
                dueDate={null}
                paid={false}
                onTogglePaid={null}
                onEdit={handleEdit}
                onDelete={handleDelete}
                fmt={fmt}
              />
            ))
        )}
      </div>
      </div>

      <UndoToast
        item={undoItem}
        itemLabel={undoItem?.bill?.name}
        onUndo={handleUndo}
        onDismiss={() => setUndoItem(null)}
      />

      <AnimatePresence>
        {showForm && (
          <BillForm
            bill={editBill}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditBill(null) }}
            settings={settings}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
