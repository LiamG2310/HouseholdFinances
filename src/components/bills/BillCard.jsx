import { motion, AnimatePresence } from 'framer-motion'
import { categoryIcon } from '../../utils/billUtils.js'
import { formatShortDate, daysUntil } from '../../utils/dateUtils.js'

function dueDateLabel(dueDate, paid) {
  if (!dueDate) return null
  if (paid) return { text: `Paid · ${formatShortDate(dueDate)}`, cls: 'text-green-400' }
  const days = daysUntil(dueDate)
  if (days < 0)   return { text: `Overdue · ${formatShortDate(dueDate)}`, cls: 'text-red-400' }
  if (days === 0) return { text: `Due today · ${formatShortDate(dueDate)}`, cls: 'text-amber-400' }
  if (days === 1) return { text: `Due tomorrow · ${formatShortDate(dueDate)}`, cls: 'text-amber-400' }
  if (days <= 7)  return { text: `Due in ${days} days · ${formatShortDate(dueDate)}`, cls: 'text-amber-400' }
  return { text: `Due ${formatShortDate(dueDate)}`, cls: 'text-slate-400' }
}

function cardColors(dueDate, paid) {
  if (paid)           return 'bg-green-950 border-green-900'
  if (!dueDate)       return 'bg-slate-800 border-slate-700'
  const days = daysUntil(dueDate)
  if (days < 0)       return 'bg-red-950 border-red-900'
  if (days <= 7)      return 'bg-amber-950 border-amber-800'
  return 'bg-slate-800 border-slate-700'
}

const FREQ_LABEL = {
  monthly: 'monthly',
  weekly: 'weekly',
  fortnightly: 'fortnightly',
  quarterly: 'quarterly',
  '6-monthly': '6-monthly',
  annual: 'annual',
  custom: 'custom',
  'one-off': 'one-off',
}

export function BillCard({ bill, dueDate, paid, onTogglePaid, onEdit, onDelete, fmt, atRisk }) {
  const dateInfo = dueDateLabel(dueDate, paid)
  const bgCls = cardColors(dueDate, paid)

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`flex items-center gap-3 p-3 rounded-xl border ${bgCls} ${paid ? 'opacity-70' : ''}`}
      >
        {onTogglePaid && (
          <motion.button
            onClick={onTogglePaid}
            whileTap={{ scale: 0.8 }}
            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${paid ? 'border-green-500 bg-green-500' : 'border-slate-500 hover:border-indigo-400'}`}
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
            {bill.source === 'direct_debit' && (
              <span className="text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded font-medium leading-none">DD</span>
            )}
            {bill.source === 'standing_order' && (
              <span className="text-xs bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded font-medium leading-none">SO</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {dateInfo && <span className={`text-xs ${dateInfo.cls}`}>{dateInfo.text}</span>}
            {!paid && atRisk && <span className="text-xs text-amber-400">⚡ Timing risk</span>}
            {!dateInfo && bill.notes && <span className="text-xs text-slate-500 truncate">{bill.notes}</span>}
          </div>
          {dateInfo && bill.notes && (
            <div className="text-xs text-slate-500 truncate mt-0.5">{bill.notes}</div>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          {bill.needsAmount ? (
            <button
              onClick={() => onEdit(bill)}
              className="text-amber-400 text-xs font-medium bg-amber-950 border border-amber-800 px-2 py-1 rounded-lg hover:bg-amber-900 transition-colors"
            >Set amount</button>
          ) : (
            <div className="font-semibold text-white">{fmt(bill.amount)}</div>
          )}
          <div className="text-xs text-slate-500 mt-0.5">{FREQ_LABEL[bill.frequency] ?? bill.frequency}</div>
        </div>

        <div className="flex flex-col gap-1">
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => onEdit(bill)} className="text-slate-500 hover:text-white text-sm px-1">✏️</motion.button>
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => onDelete(bill)} className="text-slate-500 hover:text-red-400 text-sm px-1">🗑️</motion.button>
        </div>
      </motion.div>
    </>
  )
}
