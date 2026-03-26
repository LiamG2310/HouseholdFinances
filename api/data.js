import { kv } from '@vercel/kv'
import { verifyAuth } from './_auth.js'

const DATA_KEY = 'hf:data'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = await verifyAuth(req)
  if (!user) return res.status(401).json({ error: 'Unauthorised' })

  if (req.method === 'GET') {
    const data = await kv.get(DATA_KEY)
    return res.status(200).json(data || {})
  }

  if (req.method === 'PUT') {
    await kv.set(DATA_KEY, req.body)
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
