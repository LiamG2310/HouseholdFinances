import { randomBytes } from 'crypto'
import { verifyAuth } from '../_auth.js'
import { redis, AUTH_URL } from '../_truelayer.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const user = await verifyAuth(req)
  if (!user) return res.status(401).json({ error: 'Unauthorised' })

  const state = randomBytes(16).toString('hex')
  await redis.set(`tl:state:${state}`, '1', { ex: 600 }) // valid for 10 minutes

  const redirectUri = `https://${req.headers.host}/api/truelayer/callback`

  const url = new URL(`${AUTH_URL}/`)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', process.env.TRUELAYER_CLIENT_ID)
  url.searchParams.set('scope', 'accounts balance offline_access')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('providers', 'uk-ob-all uk-oauth-all')
  url.searchParams.set('state', state)

  return res.status(200).json({ url: url.toString() })
}
