import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyTheme, applyMode } from './utils/themeUtils.js'

// Apply theme + mode before first render to avoid flash
try {
  const s = JSON.parse(localStorage.getItem('hf_settings') || '{}')
  applyTheme(s.theme ?? 'sky')
  applyMode(s.mode ?? 'dark')
} catch {
  applyTheme('sky')
  applyMode('dark')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
