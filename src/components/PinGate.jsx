import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

// PIN is set at build time via VITE_PIN env variable (GitHub secret).
// Falls back to '1234' for local development.
const CORRECT_PIN = import.meta.env.VITE_PIN || '1234'
const SESSION_KEY = 'hf_unlocked'

export function PinGate({ children }) {
  const [unlocked, setUnlocked] = useLocalStorage(SESSION_KEY, false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  if (unlocked) return children

  const handleDigit = (d) => {
    if (input.length >= 4) return
    const next = input + d
    setInput(next)
    setError(false)

    if (next.length === 4) {
      if (next === CORRECT_PIN) {
        setUnlocked(true)
      } else {
        setShake(true)
        setError(true)
        setTimeout(() => { setInput(''); setShake(false) }, 600)
      }
    }
  }

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1))
    setError(false)
  }

  const DIGITS = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    [null,'0','⌫'],
  ]

  return (
    <div className="min-h-svh bg-slate-900 flex flex-col items-center justify-center p-8">
      <div className="text-4xl mb-2">🏠</div>
      <h1 className="text-xl font-bold text-white mb-1">HomeFinances</h1>
      <p className="text-slate-400 text-sm mb-10">Enter your PIN to continue</p>

      {/* Dots */}
      <div className={`flex gap-4 mb-10 ${shake ? 'animate-bounce' : ''}`}>
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-colors ${
              i < input.length
                ? error ? 'bg-red-500 border-red-500' : 'bg-indigo-400 border-indigo-400'
                : 'border-slate-600'
            }`}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4 w-64">
        {DIGITS.flat().map((d, i) => {
          if (d === null) return <div key={i} />
          return (
            <button
              key={i}
              onClick={() => d === '⌫' ? handleDelete() : handleDigit(d)}
              className={`h-16 rounded-2xl text-xl font-semibold transition-colors ${
                d === '⌫'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              {d}
            </button>
          )
        })}
      </div>

      {error && <p className="text-red-400 text-sm mt-6">Incorrect PIN</p>}
    </div>
  )
}
