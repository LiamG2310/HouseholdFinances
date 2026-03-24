import { useState } from 'react'
import { categoryIcon } from '../../utils/billUtils.js'
import { formatShortDate, daysUntil } from '../../utils/dateUtils.js'
import { ConfirmDialog } from '../shared/ConfirmDialog.jsx'

export function BillCard({ bill, dueDate, paid, onTogglePaid, onEdit, onDelete, fmt, settings }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const days = dueDate ? daysUntil(dueDate) : null

  const dueBadge = () => {
    if (!dueDate) return null
    if (paid) return <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">Paid</span>
    if (days < 0) return <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full">Overdue</span>
    if (days <= 7) return <span className="text-xs bg-amber-900 text-amber-300 px-2 py-0.5 rounded-full">Due soon</span>
    return <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{formatShortDate(dueDate)}</span>
  }

  const assignedLabel = () => {
    if (!bill.assignedTo || bill.assignedTo === 'joint') return null
    const name = bill.assignedTo === 'person1' ? settings.person1Name : settings.person2Name
    return <span className="text-xs text-slate-500">{name}</span>
  }

  return (
    <>
      <div className={`flex items-center gap-3 p-3 rounded-xl border ${paid ? 'border-slate-700 opacity-60' : 'border-slate-700 bg-slate-800'}`}>
        {/* Paid toggle */}
        {onTogglePaid && (
          <button
            onClick={onTogglePaid}
            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${paid ? 'border-green-500 bg-green-500' : 'border-slate-500'}`}
          >
            {paid && <span className="text-white text-xs">✓</span>}
          </button>
        )}

        <span className="text-2xl">{categoryIcon(bill.category)}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${paid ? 'line-through text-slate-400' : 'text-white'}`}>{bill.name}</span>
            {assignedLabel()}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {dueBadge()}
            {bill.notes && <span className="text-xs text-slate-500 truncate">{bill.notes}</span>}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="font-semibold text-white">{fmt(bill.amount)}</div>
          <div className="text-xs text-slate-500 capitalize">{bill.frequency}</div>
        </div>

        <div className="flex flex-col gap-1">
          <button onClick={() => onEdit(bill)} className="text-slate-500 hover:text-white text-sm px-1">✏️</button>
          <button onClick={() => setConfirmDelete(true)} className="text-slate-500 hover:text-red-400 text-sm px-1">🗑️</button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${bill.name}"? This cannot be undone.`}
          onConfirm={() => { onDelete(bill.id); setConfirmDelete(false) }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  )
}
