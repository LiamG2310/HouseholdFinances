import { useState } from 'react'
import { useFinance } from '../context/FinanceContext.jsx'
import { ConfirmDialog } from '../components/shared/ConfirmDialog.jsx'
import { syncConfigured } from '../hooks/useSync.js'
import { THEMES, applyTheme, applyMode } from '../utils/themeUtils.js'

const CURRENCIES = [
  { value: 'GBP', label: '£ GBP — British Pound' },
  { value: 'EUR', label: '€ EUR — Euro' },
  { value: 'USD', label: '$ USD — US Dollar' },
  { value: 'AUD', label: 'A$ AUD — Australian Dollar' },
]

export function SettingsPage() {
  const { settings, updateSettings, syncStatus } = useFinance()
  const [confirmReset, setConfirmReset] = useState(false)
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem('hf_profile_image') || null)
  const handleLock = () => {
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
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full p-4 space-y-6 pb-24">
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

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-400">Appearance</h2>
          <div className="flex bg-slate-700 rounded-lg p-0.5">
            {['dark', 'light'].map(m => (
              <button
                key={m}
                onClick={() => { updateSettings({ mode: m }); applyMode(m) }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${
                  (settings.mode ?? 'dark') === m ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >{m}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map(theme => {
            const isActive = (settings.theme ?? 'sky') === theme.id
            return (
              <button
                key={theme.id}
                onClick={() => {
                  updateSettings({ theme: theme.id })
                  applyTheme(theme.id)
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors ${
                  isActive ? 'border-indigo-500 bg-slate-700' : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex gap-1 flex-shrink-0">
                  {theme.preview.map((hex, i) => (
                    <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: hex }} />
                  ))}
                </div>
                <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {theme.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h2 className="text-sm font-medium text-slate-400 mb-3">Sync</h2>
        {syncConfigured ? (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${syncStatus === 'error' ? 'bg-red-400' : 'bg-green-400'}`} />
            <span className={`text-sm ${syncStatus === 'error' ? 'text-red-400' : 'text-green-400'}`}>
              {syncStatus === 'saving' ? 'Saving...' : syncStatus === 'error' ? 'Sync error' : 'Syncing across devices'}
            </span>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Sync not configured — data is stored locally only.</p>
        )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-medium text-slate-400">Profile picture</h2>
        <div className="flex items-center gap-4">
          {profileImage ? (
            <div className="relative flex-shrink-0" style={{ width: '4rem', height: '4rem' }}>
              <img src={profileImage} alt="" className="w-full h-full object-cover rounded-full block" />
              <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 14px 8px rgba(0,0,0,0.45)' }} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl flex-shrink-0">🏠</div>
          )}
          <div className="flex flex-col gap-2 flex-1">
            <label className="block w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium text-center cursor-pointer">
              {profileImage ? 'Change picture' : 'Upload picture'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files[0]
                  if (!file) return
                  const img = new Image()
                  const url = URL.createObjectURL(file)
                  img.onload = () => {
                    const size = 256
                    const canvas = document.createElement('canvas')
                    canvas.width = size; canvas.height = size
                    const ctx = canvas.getContext('2d')
                    const scale = Math.max(size / img.width, size / img.height)
                    const w = img.width * scale, h = img.height * scale
                    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
                    URL.revokeObjectURL(url)
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
                    localStorage.setItem('hf_profile_image', dataUrl)
                    setProfileImage(dataUrl)
                  }
                  img.src = url
                }}
              />
            </label>
            {profileImage && (
              <button
                onClick={() => { localStorage.removeItem('hf_profile_image'); setProfileImage(null) }}
                className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 text-sm font-medium"
              >Remove</button>
            )}
          </div>
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
        Data is synced via JSONBin. Nothing is shared with third parties.
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
