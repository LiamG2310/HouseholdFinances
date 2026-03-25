import { useLocalStorage } from './useLocalStorage.js'

const FILENAME = 'household-finances.json'
const API = 'https://api.github.com'

export function useGist() {
  const [pat, setPat] = useLocalStorage('hf_pat', '')
  const [gistId, setGistId] = useLocalStorage('hf_gist_id', '')

  const headers = (token = pat) => ({
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
  })

  const createGist = async (token = pat) => {
    const res = await fetch(`${API}/gists`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({
        description: 'HomeFinances data',
        public: false,
        files: {
          [FILENAME]: {
            content: JSON.stringify({ settings: {}, bills: [], income: [], payments: [] }, null, 2)
          }
        }
      })
    })
    if (!res.ok) throw new Error('Failed to create Gist — check your PAT has gist scope')
    const data = await res.json()
    return data.id
  }

  const loadGist = async (token = pat, id = gistId) => {
    if (!token || !id) return null
    const res = await fetch(`${API}/gists/${id}`, { headers: headers(token) })
    if (!res.ok) throw new Error('Failed to load Gist')
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

  return { pat, setPat, gistId, setGistId, createGist, loadGist, saveGist }
}
