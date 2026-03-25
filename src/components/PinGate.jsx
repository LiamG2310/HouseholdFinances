import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CORRECT_PIN = import.meta.env.VITE_PIN || '1234'
const EXPIRY_KEY = 'hf_lock_expiry'
const SESSION_MS = 30 * 60 * 1000 // 30 minutes

function getExpiry() { return parseInt(localStorage.getItem(EXPIRY_KEY) || '0') }
function saveExpiry() { localStorage.setItem(EXPIRY_KEY, String(Date.now() + SESSION_MS)) }
function clearExpiry() { localStorage.removeItem(EXPIRY_KEY) }

export function PinGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => Date.now() < getExpiry())
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const timerRef = useRef(null)

  // Auto-lock when the 30-minute window expires while the app is open
  useEffect(() => {
    if (!unlocked) return
    const remaining = getExpiry() - Date.now()
    timerRef.current = setTimeout(() => {
      clearExpiry()
      setUnlocked(false)
    }, remaining)
    return () => clearTimeout(timerRef.current)
  }, [unlocked])

  if (unlocked) return children

  const handleDigit = (d) => {
    if (input.length >= 4) return
    const next = input + d
    setInput(next)
    setError(false)

    if (next.length === 4) {
      if (next === CORRECT_PIN) {
        saveExpiry()
        setUnlocked(true)
      } else {
        setShakeKey(k => k + 1)
        setError(true)
        setTimeout(() => { setInput(''); setError(false) }, 600)
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
    <motion.div
      className="min-h-svh bg-slate-900 flex flex-col items-center justify-center p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="text-5xl mb-2"
      >🏠</motion.div>
      <h1 className="text-xl font-bold text-white mb-1">HomeFinances</h1>
      <p className="text-slate-400 text-sm mb-10">Enter your PIN to continue</p>

      {/* Dots */}
      <motion.div
        key={shakeKey}
        className="flex gap-4 mb-10"
        animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {[0,1,2,3].map(i => (
          <motion.div
            key={i}
            animate={{
              scale: i < input.length ? 1.2 : 1,
              backgroundColor: i < input.length
                ? error ? 'rgb(239 68 68)' : 'rgb(129 140 248)'
                : 'transparent',
              borderColor: i < input.length
                ? error ? 'rgb(239 68 68)' : 'rgb(129 140 248)'
                : 'rgb(71 85 105)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-4 h-4 rounded-full border-2"
          />
        ))}
      </motion.div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4 w-64">
        {DIGITS.flat().map((d, i) => {
          if (d === null) return <div key={i} />
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.85 }}
              onClick={() => d === '⌫' ? handleDelete() : handleDigit(d)}
              className={`h-16 rounded-2xl text-xl font-semibold transition-colors ${
                d === '⌫'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              {d}
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-400 text-sm mt-6"
          >Incorrect PIN</motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
