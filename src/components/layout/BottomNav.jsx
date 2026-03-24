const TABS = [
  { id: 'dashboard', label: 'Overview', icon: '📊' },
  { id: 'bills',     label: 'Bills',    icon: '📋' },
  { id: 'income',    label: 'Income',   icon: '💰' },
  { id: 'settings',  label: 'Settings', icon: '⚙️' },
]

export function BottomNav({ active, onSelect }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40 pb-safe">
      <div className="flex max-w-lg mx-auto">
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
