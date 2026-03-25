import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function UndoToast({ item, itemLabel, onUndo, onDismiss }) {
  const [progress, setProgress] = useState(100)
  const rafRef = useRef(null)
  const startRef = useRef(null)
  const DURATION = 5000

  useEffect(() => {
    if (!item) { setProgress(100); return }
    startRef.current = Date.now()

    const tick = () => {
      const elapsed = Date.now() - startRef.current
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100)
      setProgress(pct)
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [item])

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-50"
        >
          <div className="bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
            <span className="text-slate-300 text-sm flex-1 truncate">
              Deleted <span className="text-white font-medium">"{itemLabel}"</span>
            </span>
            <button
              onClick={onUndo}
              className="text-indigo-400 font-semibold text-sm px-3 py-1 rounded-lg hover:bg-slate-600 flex-shrink-0"
            >Undo</button>
          </div>
          <div className="h-1 bg-slate-600 rounded-full mt-1.5 overflow-hidden mx-1">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${progress}%`, transition: 'none' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
