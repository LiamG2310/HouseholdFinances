import { verifyAuth } from '../_auth.js'
import { redis } from '../_truelayer.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await verifyAuth(req)
  if (!user) return res.status(401).json({ error: 'Unauthorised' })

  await redis.del('tl:tokens')
  await redis.del('tl:data')

  return res.status(200).json({ ok: true })
}
