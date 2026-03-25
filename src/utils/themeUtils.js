export const THEMES = [
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Default indigo — clean & professional',
    preview: ['#4f46e5', '#6366f1', '#818cf8'],
    bg: '#0f172a',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cyan accent, deep navy background',
    preview: ['#0891b2', '#06b6d4', '#22d3ee'],
    bg: '#0a1829',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Emerald accent, dark green background',
    preview: ['#059669', '#10b981', '#34d399'],
    bg: '#0a180d',
  },
  {
    id: 'violet',
    name: 'Violet',
    description: 'Purple accent, deep violet background',
    preview: ['#7c3aed', '#8b5cf6', '#a78bfa'],
    bg: '#10081a',
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Pink accent, dark rose background',
    preview: ['#e11d48', '#f43f5e', '#fb7185'],
    bg: '#14080a',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Orange accent, warm ember background',
    preview: ['#ea580c', '#f97316', '#fb923c'],
    bg: '#120d04',
  },
  {
    id: 'gold',
    name: 'Gold',
    description: 'Amber accent, neutral zinc background',
    preview: ['#d97706', '#f59e0b', '#fbbf24'],
    bg: '#18181b',
  },
  {
    id: 'sky',
    name: 'Sky',
    description: 'Bright blue accent, cool slate background',
    preview: ['#0284c7', '#0ea5e9', '#38bdf8'],
    bg: '#0f172a',
  },
]

const STORAGE_KEY = 'hf_theme'

export function applyTheme(themeId) {
  if (themeId === 'midnight') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', themeId)
  }
}

export function loadStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY) ?? 'midnight'
  applyTheme(stored)
  return stored
}

export function saveTheme(themeId) {
  localStorage.setItem(STORAGE_KEY, themeId)
  applyTheme(themeId)
}
