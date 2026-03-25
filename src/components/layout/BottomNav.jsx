import { useFinance } from '../../context/FinanceContext.jsx'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = [
  { id: 'dashboard', label: 'Overview', icon: '📊' },
  { id: 'bills',     label: 'Bills',    icon: '📋' },
  { id: 'income',    label: 'Income',   icon: '💰' },
  { id: 'settings',  label: 'Settings', icon: '⚙️' },
  { id: 'theme',     label: 'Theme',    icon: '🎨' },
]

function SyncDot({ status }) {
  if (status === 'idle') return null
  const styles = {
    saving: 'bg-amber-400 animate-pulse',
    saved:  'bg-green-400',
    error:  'bg-red-400',
  }
  return (
    <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${styles[status]}`} />
  )
}

export function BottomNav({ active, onSelect }) {
  const { syncStatus } = useFinance()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40 pb-safe">
      <div className="flex max-w-lg mx-auto relative">
        <SyncDot status={syncStatus} />
        {TABS.map(tab => (
          <motion.button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            whileTap={{ scale: 0.85 }}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors relative ${
              active === tab.id ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            {active === tab.id && (
              <motion.span
                layoutId="nav-indicator"
                className="absolute top-0 left-2 right-2 h-0.5 bg-indigo-400 rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <motion.span
              className="text-xl"
              animate={{ scale: active === tab.id ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >{tab.icon}</motion.span>
            <span className="text-xs">{tab.label}</span>
          </motion.button>
        ))}
      </div>
    </nav>
  )
}
