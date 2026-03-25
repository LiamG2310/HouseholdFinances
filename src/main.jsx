import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyTheme } from './utils/themeUtils.js'

// Apply theme before first render to avoid flash
try {
  const s = JSON.parse(localStorage.getItem('hf_settings') || '{}')
  applyTheme(s.theme ?? 'sky')
} catch { applyTheme('sky') }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
