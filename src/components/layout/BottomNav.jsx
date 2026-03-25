import { useFinance } from '../../context/FinanceContext.jsx'

const TABS = [
  { id: 'dashboard', label: 'Overview', icon: '📊' },
  { id: 'bills',     label: 'Bills',    icon: '📋' },
  { id: 'income',    label: 'Income',   icon: '💰' },
  { id: 'settings',  label: 'Settings', icon: '⚙️' },
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
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${
              active === tab.id ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
