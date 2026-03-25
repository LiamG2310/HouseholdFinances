export const THEMES = [
  {
    id: 'sky',
    name: 'Sky',
    preview: ['#0284c7', '#0ea5e9', '#38bdf8'],
  },
  {
    id: 'forest',
    name: 'Forest',
    preview: ['#059669', '#10b981', '#34d399'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    preview: ['#0891b2', '#06b6d4', '#22d3ee'],
  },
  {
    id: 'midnight',
    name: 'Midnight',
    preview: ['#4f46e5', '#6366f1', '#818cf8'],
  },
]

export function applyTheme(themeId) {
  if (!themeId || themeId === 'midnight') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', themeId)
  }
}
