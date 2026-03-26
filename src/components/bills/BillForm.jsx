import { useState } from 'react'
import { Modal } from '../shared/Modal.jsx'
import { CATEGORIES, FREQUENCIES } from '../../utils/billUtils.js'
import { today } from '../../utils/dateUtils.js'

const MONTHS = [
  { value: 1,  label: 'Jan' }, { value: 2,  label: 'Feb' }, { value: 3,  label: 'Mar' },
  { value: 4,  label: 'Apr' }, { value: 5,  label: 'May' }, { value: 6,  label: 'Jun' },
  { value: 7,  label: 'Jul' }, { value: 8,  label: 'Aug' }, { value: 9,  label: 'Sep' },
  { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' },
]

const DEFAULTS = {
  name: '',
  amount: '',
  category: 'other',
  frequency: 'monthly',
  dayOfMonth: 1,
  nextDueDate: today(),
  activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12],
  notes: '',
}

export function BillForm({ bill, onSave, onClose, settings }) {
  const [form, setForm] = useState(bill ? {
    ...DEFAULTS,
    ...bill,
    amount: bill.needsAmount ? '' : String(bill.amount),
    dayOfMonth: bill.dayOfMonth ?? 1,
    activeMonths: bill.activeMonths ?? DEFAULTS.activeMonths,
  } : DEFAULTS)

  const [errors, setErrors] = useState({})
  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const toggleMonth = (m) => {
    setForm(prev => ({
      ...prev,
      activeMonths: prev.activeMonths.includes(m)
        ? prev.activeMonths.filter(x => x !== m)
        : [...prev.activeMonths, m].sort((a, b) => a - b),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Enter a valid amount'
    if (form.frequency === 'custom' && form.activeMonths.length === 0) errs.activeMonths = 'Select at least one month'
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({
      ...form,
      amount: parseFloat(form.amount),
      dayOfMonth: parseInt(form.dayOfMonth) || 1,
    })
  }

  const inputCls = 'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500'
  const labelCls = 'block text-sm text-slate-400 mb-1'

  return (
    <Modal title={bill ? 'Edit Bill' : 'Add Bill'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Name</label>
          <input
            className={`${inputCls} ${errors.name ? 'border-red-500' : ''}`}
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Rent"
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
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
            <label className={labelCls}>Category</label>
            <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Frequency</label>
            <select className={inputCls} value={form.frequency} onChange={e => set('frequency', e.target.value)}>
              {FREQUENCIES.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        {(form.frequency === 'monthly' || form.frequency === 'custom') && (
          <div>
            <label className={labelCls}>Day of month</label>
            <input
              className={inputCls}
              type="number"
              min="1"
              max="31"
              value={form.dayOfMonth}
              onChange={e => set('dayOfMonth', e.target.value)}
            />
          </div>
        )}

        {form.frequency === 'custom' && (
          <div>
            <label className={labelCls}>
              Active months ({form.activeMonths.length} selected)
            </label>
            <div className="grid grid-cols-6 gap-1.5 mt-1">
              {MONTHS.map(({ value, label }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => toggleMonth(value)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    form.activeMonths.includes(value)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >{label}</button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              e.g. council tax: select Apr–Jan (10 months), skip Feb & Mar
            </p>
            {errors.activeMonths && <p className="text-red-400 text-xs mt-1">{errors.activeMonths}</p>}
          </div>
        )}

        {!['monthly', 'custom'].includes(form.frequency) && (
          <div>
            <label className={labelCls}>
              {form.frequency === 'one-off' ? 'Due date' : 'Next due date'}
            </label>
            <input
              className={inputCls}
              type="date"
              value={form.nextDueDate}
              onChange={e => set('nextDueDate', e.target.value)}
            />
          </div>
        )}

        <div>
          <label className={labelCls}>Notes (optional)</label>
          <input
            className={inputCls}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Any notes..."
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold mt-2"
        >
          {bill ? 'Save Changes' : 'Add Bill'}
        </button>
      </form>
    </Modal>
  )
}
