import { verifyAuth } from '../_auth.js'
import { redis, getValidAccessToken, fetchBankData } from '../_truelayer.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await verifyAuth(req)
  if (!user) return res.status(401).json({ error: 'Unauthorised' })

  const accessToken = await getValidAccessToken()
  if (!accessToken) return res.status(401).json({ error: 'Bank connection expired. Please reconnect.' })

  try {
    const bankData = await fetchBankData(accessToken)
    await redis.set('tl:data', bankData)
    return res.status(200).json({ bankData })
  } catch (e) {
    return res.status(502).json({ error: 'Failed to fetch bank data' })
  }
}
