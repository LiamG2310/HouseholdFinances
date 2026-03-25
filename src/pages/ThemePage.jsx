import { useState } from 'react'
import { motion } from 'framer-motion'
import { THEMES, saveTheme, loadStoredTheme } from '../utils/themeUtils.js'

const card = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

export function ThemePage() {
  const [active, setActive] = useState(() => loadStoredTheme())

  const select = (id) => {
    saveTheme(id)
    setActive(id)
  }

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
      <div className="p-4">
        <h1 className="text-xl font-bold text-white">Theme</h1>
        <p className="text-slate-400 text-sm mt-0.5">Pick a colour scheme — changes apply instantly across the whole app.</p>
      </div>

      <motion.div
        className="flex-1 overflow-y-auto px-4 pb-24 space-y-3"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {THEMES.map((theme) => {
          const isActive = active === theme.id
          return (
            <motion.button
              key={theme.id}
              variants={card}
              onClick={() => select(theme.id)}
              whileTap={{ scale: 0.97 }}
              className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                isActive
                  ? 'bg-slate-800 border-indigo-500'
                  : 'bg-slate-800 border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Colour swatches */}
                <div className="flex gap-1.5 flex-shrink-0">
                  {theme.preview.map((hex, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-xl shadow-sm"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{theme.name}</span>
                    {isActive && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full"
                      >Active</motion.span>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm truncate">{theme.description}</p>
                </div>

                {/* Check */}
                <motion.div
                  animate={{ scale: isActive ? 1 : 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0"
                >
                  <span className="text-white text-xs">✓</span>
                </motion.div>
              </div>

              {/* Mini app preview strip */}
              <div className="mt-3 flex gap-2 items-center">
                <div className="h-2 flex-1 rounded-full bg-slate-700 overflow-hidden">
                  <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: theme.preview[0] }} />
                </div>
                <div
                  className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                  style={{ backgroundColor: theme.preview[0] }}
                >Button</div>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: theme.preview[2] }}
                />
              </div>
            </motion.button>
          )
        })}

        <p className="text-xs text-slate-600 text-center pt-2 pb-4">
          This tab is temporary — remove it once you've picked a theme.
        </p>
      </motion.div>
    </div>
  )
}
