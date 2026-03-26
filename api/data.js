import { verifyAuth } from './_auth.js'

const BIN_URL = `https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`
const KEY = process.env.JSONBIN_KEY

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = await verifyAuth(req)
  if (!user) return res.status(401).json({ error: 'Unauthorised' })

  if (req.method === 'GET') {
    const r = await fetch(`${BIN_URL}/latest`, {
      headers: { 'X-Master-Key': KEY },
    })
    if (!r.ok) return res.status(502).json({ error: 'Upstream error' })
    const { record } = await r.json()
    return res.status(200).json(record)
  }

  if (req.method === 'PUT') {
    const r = await fetch(BIN_URL, {
      method: 'PUT',
      headers: { 'X-Master-Key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })
    if (!r.ok) return res.status(502).json({ error: 'Upstream error' })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
