import { useState } from 'react'

import { Modal } from '../shared/Modal.jsx'
import { today } from '../../utils/dateUtils.js'

const FREQ = [
  { value: 'monthly',     label: 'Monthly' },
  { value: 'weekly',      label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'annual',      label: 'Annual' },
]

const DEFAULTS = {
  label: '',
  amount: '',
  personId: 'person1',
  frequency: 'monthly',
  nextDate: today(),
}

export function IncomeForm({ income, onSave, onClose, settings }) {
  const [form, setForm] = useState(income ? {
    ...DEFAULTS,
    ...income,
    amount: String(income.amount),
  } : DEFAULTS)

  const [errors, setErrors] = useState({})
  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.label.trim()) errs.label = 'Label is required'
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Enter a valid amount'
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ ...form, amount: parseFloat(form.amount) })
  }

  const inputCls = 'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500'
  const labelCls = 'block text-sm text-slate-400 mb-1'

  return (
    <Modal title={income ? 'Edit Income' : 'Add Income'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Label</label>
          <input
            className={`${inputCls} ${errors.label ? 'border-red-500' : ''}`}
            value={form.label}
            onChange={e => set('label', e.target.value)}
            placeholder="e.g. Salary"
          />
          {errors.label && <p className="text-red-400 text-xs mt-1">{errors.label}</p>}
        </div>

        <div>
          <label className={labelCls}>Amount ({settings.currency})</label>
          <input
            className={`${inputCls} ${errors.amount ? 'border-red-500' : ''}`}
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            placeholder="0.00"
          />
          {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Person</label>
            <select className={inputCls} value={form.personId} onChange={e => set('personId', e.target.value)}>
              <option value="person1">{settings.person1Name}</option>
              <option value="person2">{settings.person2Name}</option>
              <option value="joint">Joint</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Frequency</label>
            <select className={inputCls} value={form.frequency} onChange={e => set('frequency', e.target.value)}>
              {FREQ.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
        >
          {income ? 'Save Changes' : 'Add Income'}
        </button>
      </form>
    </Modal>
  )
}
