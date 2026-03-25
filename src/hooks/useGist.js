import { useLocalStorage } from './useLocalStorage.js'

const FILENAME = 'household-finances.json'
const API = 'https://api.github.com'

// Gist ID baked in at build time via GitHub secret — falls back to localStorage for local dev
const BUILT_IN_GIST_ID = import.meta.env.VITE_GIST_ID || ''

export function useGist() {
  const [pat, setPat] = useLocalStorage('hf_pat', '')
  const [storedGistId, setStoredGistId] = useLocalStorage('hf_gist_id', '')

  // Prefer the build-time Gist ID; fall back to anything stored locally
  const gistId = BUILT_IN_GIST_ID || storedGistId

  const headers = (token = pat) => ({
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
  })

  const loadGist = async (token = pat, id = gistId) => {
    if (!token || !id) return null
    const res = await fetch(`${API}/gists/${id}`, { headers: headers(token) })
    if (!res.ok) throw new Error('Failed to load Gist — check your PAT is correct')
    const data = await res.json()
    const file = data.files[FILENAME]
    if (!file) throw new Error('Gist file not found')
    return JSON.parse(file.content)
  }

  const saveGist = async (data) => {
    if (!pat || !gistId) return
    const res = await fetch(`${API}/gists/${gistId}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({
        files: { [FILENAME]: { content: JSON.stringify(data, null, 2) } }
      })
    })
    if (!res.ok) throw new Error('Failed to save to Gist')
  }

  return { pat, setPat, gistId, setStoredGistId, loadGist, saveGist }
}
