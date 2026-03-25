// Sync layer using JSONBin.io — credentials baked in at build time via GitHub secrets.
const BIN_ID  = import.meta.env.VITE_JSONBIN_BIN_ID || ''
const API_KEY = import.meta.env.VITE_JSONBIN_KEY || ''
const API     = 'https://api.jsonbin.io/v3/b'

const headers = {
  'X-Master-Key': API_KEY,
  'Content-Type': 'application/json',
}

export const syncConfigured = !!(BIN_ID && API_KEY)

export async function loadData() {
  if (!syncConfigured) return null
  const res = await fetch(`${API}/${BIN_ID}/latest`, { headers })
  if (!res.ok) throw new Error(`Failed to load data (${res.status})`)
  const json = await res.json()
  return json.record
}

export async function saveData(data) {
  if (!syncConfigured) return
  const res = await fetch(`${API}/${BIN_ID}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to save data (${res.status})`)
}
