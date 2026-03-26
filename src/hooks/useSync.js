// When VITE_USE_API=true (Vercel), all requests go through the backend.
// Otherwise (local dev / GitHub Pages), falls back to direct JSONBin access.

const USE_API = import.meta.env.VITE_USE_API === 'true'

// Dev fallback — direct JSONBin
const BIN_ID  = import.meta.env.VITE_JSONBIN_BIN_ID || ''
const API_KEY = import.meta.env.VITE_JSONBIN_KEY || ''
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`

export const syncConfigured = USE_API || !!(BIN_ID && API_KEY)
export { USE_API }

export function getToken() {
  return localStorage.getItem('hf_session_token') || ''
}

export function authHeaders() {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  }
}

function onUnauthorised() {
  localStorage.removeItem('hf_session_token')
  window.location.reload()
}

export async function loadData() {
  if (!syncConfigured) return null

  if (USE_API) {
    const res = await fetch('/api/data', { headers: authHeaders() })
    if (res.status === 401) { onUnauthorised(); return null }
    if (!res.ok) throw new Error(`Failed to load data (${res.status})`)
    return res.json()
  }

  // Dev: direct JSONBin
  const res = await fetch(`${JSONBIN_URL}/latest`, {
    headers: { 'X-Master-Key': API_KEY },
  })
  if (!res.ok) throw new Error(`Failed to load data (${res.status})`)
  const json = await res.json()
  return json.record
}

export async function saveData(data) {
  if (!syncConfigured) return

  if (USE_API) {
    const res = await fetch('/api/data', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
    if (res.status === 401) { onUnauthorised(); return }
    if (!res.ok) throw new Error(`Failed to save data (${res.status})`)
    return
  }

  // Dev: direct JSONBin
  const res = await fetch(JSONBIN_URL, {
    method: 'PUT',
    headers: { 'X-Master-Key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to save data (${res.status})`)
}
