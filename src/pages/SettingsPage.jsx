import { useState } from 'react'
import { useFinance } from '../context/FinanceContext.jsx'
import { ConfirmDialog } from '../components/shared/ConfirmDialog.jsx'
import { useLocalStorage } from '../hooks/useLocalStorage.js'


const CURRENCIES = [
  { value: 'GBP', label: '£ GBP — British Pound' },
  { value: 'EUR', label: '€ EUR — Euro' },
  { value: 'USD', label: '$ USD — US Dollar' },
  { value: 'AUD', label: 'A$ AUD — Australian Dollar' },
]

export function SettingsPage() {
  const { settings, updateSettings } = useFinance()
  const [confirmReset, setConfirmReset] = useState(false)
  const [, setUnlocked] = useLocalStorage('hf_unlocked', false)

  const handleLock = () => {
    setUnlocked(false)
    window.location.reload()
  }

  const handleExport = () => {
    const data = {
      hf_settings: JSON.parse(localStorage.getItem('hf_settings') || 'null'),
      hf_bills: JSON.parse(localStorage.getItem('hf_bills') || '[]'),
      hf_income: JSON.parse(localStorage.getItem('hf_income') || '[]'),
      hf_payments: JSON.parse(localStorage.getItem('hf_payments') || '[]'),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `homefinances-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        for (const key of ['hf_settings', 'hf_bills', 'hf_income', 'hf_payments']) {
          if (data[key] !== undefined) localStorage.setItem(key, JSON.stringify(data[key]))
        }
        window.location.reload()
      } catch {
        alert('Invalid file')
      }
    }
    reader.readAsText(file)
  }

  const handleReset = () => {
    localStorage.removeItem('hf_bills')
    localStorage.removeItem('hf_income')
    localStorage.removeItem('hf_payments')
    localStorage.removeItem('hf_settings')
    window.location.reload()
  }

  const inputCls = 'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500'
  const labelCls = 'block text-sm text-slate-400 mb-1'

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full p-4 space-y-6">
      <h1 className="text-xl font-bold text-white">Settings</h1>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-medium text-slate-400">Household</h2>

        <div>
          <label className={labelCls}>Person 1 name</label>
          <input
            className={inputCls}
            value={settings.person1Name}
            onChange={e => updateSettings({ person1Name: e.target.value })}
          />
        </div>

        <div>
          <label className={labelCls}>Person 2 name</label>
          <input
            className={inputCls}
            value={settings.person2Name}
            onChange={e => updateSettings({ person2Name: e.target.value })}
          />
        </div>

        <div>
          <label className={labelCls}>Currency</label>
          <select
            className={inputCls}
            value={settings.currency}
            onChange={e => updateSettings({ currency: e.target.value })}
          >
            {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-medium text-slate-400">Data</h2>

        <button
          onClick={handleExport}
          className="w-full py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium"
        >Export data (JSON)</button>

        <label className="block w-full py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium text-center cursor-pointer">
          Import data (JSON)
          <input type="file" accept=".json" className="hidden" onChange={handleImport} />
        </label>

        <button
          onClick={() => setConfirmReset(true)}
          className="w-full py-2.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-400 text-sm font-medium border border-red-900"
        >Reset all data</button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-medium text-slate-400">Security</h2>
        <p className="text-xs text-slate-500">PIN is shared across all devices. To change it, update the PIN secret in GitHub and redeploy.</p>
        <button
          onClick={handleLock}
          className="w-full py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium"
        >🔒 Lock app</button>
      </div>

      <div className="text-center text-slate-600 text-xs">
        All data is stored locally on this device. Nothing is sent to any server.
      </div>

      {confirmReset && (
        <ConfirmDialog
          message="This will permanently delete all bills, income, and payment data. Are you sure?"
          onConfirm={handleReset}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  )
}
