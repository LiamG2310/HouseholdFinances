import { Redis } from '@upstash/redis'
import { verifyAuth } from './_auth.js'

const redis = new Redis({
  url: process.env.HFSTORE_KV_REST_API_URL,
  token: process.env.HFSTORE_KV_REST_API_TOKEN,
})
const DATA_KEY = 'hf:data'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = await verifyAuth(req)
  if (!user) return res.status(401).json({ error: 'Unauthorised' })

  if (req.method === 'GET') {
    const data = await redis.get(DATA_KEY)
    return res.status(200).json(data || {})
  }

  if (req.method === 'PUT') {
    await redis.set(DATA_KEY, req.body)
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
