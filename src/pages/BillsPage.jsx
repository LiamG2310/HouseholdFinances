import { useState, useMemo } from 'react'
import { useFinance } from '../context/FinanceContext.jsx'
import { BillCard } from '../components/bills/BillCard.jsx'
import { BillForm } from '../components/bills/BillForm.jsx'
import { EmptyState } from '../components/shared/EmptyState.jsx'

export function BillsPage() {
  const { bills, addBill, updateBill, deleteBill, getBillsMonth, isPaid, markPaid, markUnpaid, fmt, settings } = useFinance()
  const [showForm, setShowForm] = useState(false)
  const [editBill, setEditBill] = useState(null)
  const [tab, setTab] = useState('month')

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const mk = `${year}-${String(month).padStart(2, '0')}`

  const monthBills = useMemo(() => getBillsMonth(year, month), [getBillsMonth, year, month])

  const handleSave = (data) => {
    if (editBill) {
      updateBill(editBill.id, data)
    } else {
      addBill(data)
    }
    setShowForm(false)
    setEditBill(null)
  }

  const handleEdit = (bill) => {
    setEditBill(bill)
    setShowForm(true)
  }

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Bills</h1>
        <button
          onClick={() => { setEditBill(null); setShowForm(true) }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >+ Add</button>
      </div>

      <div className="flex px-4 gap-2 mb-4">
        <button
          onClick={() => setTab('month')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'month' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
        >This Month</button>
        <button
          onClick={() => setTab('all')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
        >All Bills</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-2">
        {tab === 'month' && (
          monthBills.length === 0
            ? <EmptyState icon="📅" message="No bills due this month" />
            : monthBills.map(({ bill, dueDate }) => (
              <BillCard
                key={bill.id}
                bill={bill}
                dueDate={dueDate}
                paid={isPaid(bill.id, mk)}
                onTogglePaid={() => isPaid(bill.id, mk) ? markUnpaid(bill.id, mk) : markPaid(bill.id, mk, 'joint', bill.amount)}
                onEdit={handleEdit}
                onDelete={deleteBill}
                fmt={fmt}
                settings={settings}
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
                onDelete={deleteBill}
                fmt={fmt}
                settings={settings}
              />
            ))
        )}
      </div>

      {showForm && (
        <BillForm
          bill={editBill}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditBill(null) }}
          settings={settings}
        />
      )}
    </div>
  )
}
