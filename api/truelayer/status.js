import { verifyAuth } from '../_auth.js'
import { redis, getValidAccessToken } from '../_truelayer.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const user = await verifyAuth(req)
  if (!user) return res.status(401).json({ error: 'Unauthorised' })

  const tokens = await redis.get('tl:tokens')
  if (!tokens) return res.status(200).json({ connected: false, expired: false, bankData: null })

  // Check if refresh token is still usable
  const accessToken = await getValidAccessToken()
  if (!accessToken) return res.status(200).json({ connected: false, expired: true, bankData: null })

  const bankData = await redis.get('tl:data')
  return res.status(200).json({
    connected: true,
    expired: false,
    connectedAt: tokens.connected_at,
    bankData,
  })
}
