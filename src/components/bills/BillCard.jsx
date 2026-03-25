import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: paid ? 0.6 : 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`flex items-center gap-3 p-3 rounded-xl border border-slate-700 ${paid ? '' : 'bg-slate-800'}`}
      >
        {onTogglePaid && (
          <motion.button
            onClick={onTogglePaid}
            whileTap={{ scale: 0.8 }}
            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${paid ? 'border-green-500 bg-green-500' : 'border-slate-500'}`}
          >
            <AnimatePresence>
              {paid && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-white text-xs"
                >✓</motion.span>
              )}
            </AnimatePresence>
          </motion.button>
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
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => onEdit(bill)} className="text-slate-500 hover:text-white text-sm px-1">✏️</motion.button>
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => setConfirmDelete(true)} className="text-slate-500 hover:text-red-400 text-sm px-1">🗑️</motion.button>
        </div>
      </motion.div>

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
