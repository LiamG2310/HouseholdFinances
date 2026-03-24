import { useState } from 'react'
import { useFinance } from '../context/FinanceContext.jsx'
import { IncomeForm } from '../components/income/IncomeForm.jsx'
import { ConfirmDialog } from '../components/shared/ConfirmDialog.jsx'
import { EmptyState } from '../components/shared/EmptyState.jsx'
import { toMonthly } from '../utils/billUtils.js'

function IncomeCard({ income, onEdit, onDelete, fmt }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const monthly = toMonthly(income.amount, income.frequency)

  return (
    <>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700">
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium">{income.label}</div>
          <div className="text-slate-400 text-sm capitalize">{income.frequency}</div>
        </div>
        <div className="text-right">
          <div className="text-white font-semibold">{fmt(income.amount)}</div>
          {income.frequency !== 'monthly' && (
            <div className="text-slate-400 text-xs">{fmt(monthly)}/mo</div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={() => onEdit(income)} className="text-slate-500 hover:text-white text-sm px-1">✏️</button>
          <button onClick={() => setConfirmDelete(true)} className="text-slate-500 hover:text-red-400 text-sm px-1">🗑️</button>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          message={`Remove "${income.label}"?`}
          onConfirm={() => { onDelete(income.id); setConfirmDelete(false) }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  )
}

export function IncomePage() {
  const { incomes, addIncome, updateIncome, deleteIncome, monthlyTotal, monthlyByPerson, fmt, settings } = useFinance()
  const [showForm, setShowForm] = useState(false)
  const [editIncome, setEditIncome] = useState(null)

  const handleSave = (data) => {
    if (editIncome) {
      updateIncome(editIncome.id, data)
    } else {
      addIncome(data)
    }
    setShowForm(false)
    setEditIncome(null)
  }

  const person1Incomes = incomes.filter(i => i.personId === 'person1' && i.active)
  const person2Incomes = incomes.filter(i => i.personId === 'person2' && i.active)
  const jointIncomes = incomes.filter(i => i.personId === 'joint' && i.active)

  const Section = ({ title, items }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-slate-400">{title}</h2>
        {items.length > 0 && (
          <span className="text-sm text-white">{fmt(items.reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0))}/mo</span>
        )}
      </div>
      {items.length === 0
        ? <p className="text-slate-600 text-sm py-2">None added</p>
        : <div className="space-y-2">
            {items.map(i => (
              <IncomeCard
                key={i.id}
                income={i}
                onEdit={(inc) => { setEditIncome(inc); setShowForm(true) }}
                onDelete={deleteIncome}
                fmt={fmt}
              />
            ))}
          </div>
      }
    </div>
  )

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Income</h1>
        <button
          onClick={() => { setEditIncome(null); setShowForm(true) }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >+ Add</button>
      </div>

      {/* Combined total */}
      <div className="mx-4 mb-4 bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="text-slate-400 text-sm">Combined monthly</div>
        <div className="text-3xl font-bold text-white mt-1">{fmt(monthlyTotal)}</div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-6">
        {incomes.length === 0 ? (
          <EmptyState
            icon="💰"
            message="No income added yet"
            action={
              <button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm"
              >Add income</button>
            }
          />
        ) : (
          <>
            <Section title={settings.person1Name} items={person1Incomes} />
            <Section title={settings.person2Name} items={person2Incomes} />
            {jointIncomes.length > 0 && <Section title="Joint" items={jointIncomes} />}
          </>
        )}
      </div>

      {showForm && (
        <IncomeForm
          income={editIncome}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditIncome(null) }}
          settings={settings}
        />
      )}
    </div>
  )
}
