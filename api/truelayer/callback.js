import { redis, AUTH_URL, fetchBankData } from '../_truelayer.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { code, state, error } = req.query
  const appBase = `https://${req.headers.host}`

  if (error || !code || !state) {
    return res.redirect(302, `${appBase}/?tl=error`)
  }

  // Verify CSRF state
  const valid = await redis.get(`tl:state:${state}`)
  if (!valid) return res.redirect(302, `${appBase}/?tl=error`)
  await redis.del(`tl:state:${state}`)

  // Exchange code for tokens
  const redirectUri = `${appBase}/api/truelayer/callback`
  const tokenRes = await fetch(`${AUTH_URL}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.TRUELAYER_CLIENT_ID,
      client_secret: process.env.TRUELAYER_CLIENT_SECRET,
      redirect_uri: redirectUri,
      code,
    }),
  })

  if (!tokenRes.ok) return res.redirect(302, `${appBase}/?tl=error`)

  const tokenData = await tokenRes.json()
  const tokens = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry: Date.now() + tokenData.expires_in * 1000,
    connected_at: new Date().toISOString(),
  }
  await redis.set('tl:tokens', tokens)

  // Fetch initial bank data
  try {
    const bankData = await fetchBankData(tokens.access_token)
    await redis.set('tl:data', bankData)
  } catch {
    // Non-fatal — data will be fetched on next sync
  }

  return res.redirect(302, `${appBase}/?tl=connected`)
}
