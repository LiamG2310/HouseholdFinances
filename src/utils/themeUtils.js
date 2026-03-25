// Tailwind v4 exposes colors as CSS custom properties (--color-indigo-*).
// Overriding these on :root remaps every bg-indigo-*, text-indigo-*, etc. across the whole app.

export const THEMES = [
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Default indigo — clean & professional',
    preview: ['#4f46e5', '#6366f1', '#818cf8'],
    vars: null, // default — no overrides needed
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cyan — cool & refreshing',
    preview: ['#0891b2', '#06b6d4', '#22d3ee'],
    vars: {
      '--color-indigo-400': '#22d3ee',
      '--color-indigo-500': '#06b6d4',
      '--color-indigo-600': '#0891b2',
      '--color-indigo-950': '#083344',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Emerald — calm & natural',
    preview: ['#059669', '#10b981', '#34d399'],
    vars: {
      '--color-indigo-400': '#34d399',
      '--color-indigo-500': '#10b981',
      '--color-indigo-600': '#059669',
      '--color-indigo-950': '#022c22',
    },
  },
  {
    id: 'violet',
    name: 'Violet',
    description: 'Purple — bold & creative',
    preview: ['#7c3aed', '#8b5cf6', '#a78bfa'],
    vars: {
      '--color-indigo-400': '#a78bfa',
      '--color-indigo-500': '#8b5cf6',
      '--color-indigo-600': '#7c3aed',
      '--color-indigo-950': '#2e1065',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Pink — soft & modern',
    preview: ['#e11d48', '#f43f5e', '#fb7185'],
    vars: {
      '--color-indigo-400': '#fb7185',
      '--color-indigo-500': '#f43f5e',
      '--color-indigo-600': '#e11d48',
      '--color-indigo-950': '#4c0519',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Orange — warm & energetic',
    preview: ['#ea580c', '#f97316', '#fb923c'],
    vars: {
      '--color-indigo-400': '#fb923c',
      '--color-indigo-500': '#f97316',
      '--color-indigo-600': '#ea580c',
      '--color-indigo-950': '#431407',
    },
  },
  {
    id: 'gold',
    name: 'Gold',
    description: 'Amber — premium & warm',
    preview: ['#d97706', '#f59e0b', '#fbbf24'],
    vars: {
      '--color-indigo-400': '#fbbf24',
      '--color-indigo-500': '#f59e0b',
      '--color-indigo-600': '#d97706',
      '--color-indigo-950': '#431a02',
    },
  },
  {
    id: 'sky',
    name: 'Sky',
    description: 'Blue — bright & airy',
    preview: ['#0284c7', '#0ea5e9', '#38bdf8'],
    vars: {
      '--color-indigo-400': '#38bdf8',
      '--color-indigo-500': '#0ea5e9',
      '--color-indigo-600': '#0284c7',
      '--color-indigo-950': '#082f49',
    },
  },
]

const STORAGE_KEY = 'hf_theme'

export function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0]
  const root = document.documentElement

  // Clear any previous overrides
  THEMES.forEach(t => {
    if (t.vars) Object.keys(t.vars).forEach(k => root.style.removeProperty(k))
  })

  // Apply new overrides
  if (theme.vars) {
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v))
  }
}

export function loadStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) applyTheme(stored)
  return stored ?? 'midnight'
}

export function saveTheme(themeId) {
  localStorage.setItem(STORAGE_KEY, themeId)
  applyTheme(themeId)
}
