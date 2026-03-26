import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.HFSTORE_KV_REST_API_URL,
  token: process.env.HFSTORE_KV_REST_API_TOKEN,
})

const SANDBOX = process.env.TRUELAYER_SANDBOX === 'true'
export const AUTH_URL = SANDBOX ? 'https://auth.truelayer-sandbox.com' : 'https://auth.truelayer.com'
export const API_URL  = SANDBOX ? 'https://api.truelayer-sandbox.com'  : 'https://api.truelayer.com'

// Returns a valid access token, refreshing silently if expired. Returns null if re-consent needed.
export async function getValidAccessToken() {
  const tokens = await redis.get('tl:tokens')
  if (!tokens) return null

  // Still valid with a 2-minute buffer
  if (Date.now() < tokens.expiry - 120_000) return tokens.access_token

  // Attempt silent refresh
  const res = await fetch(`${AUTH_URL}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.TRUELAYER_CLIENT_ID,
      client_secret: process.env.TRUELAYER_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
    }),
  })

  if (!res.ok) {
    // Refresh token expired — user must re-consent
    await redis.del('tl:tokens')
    return null
  }

  const data = await res.json()
  const updated = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || tokens.refresh_token,
    expiry: Date.now() + data.expires_in * 1000,
    connected_at: tokens.connected_at,
  }
  await redis.set('tl:tokens', updated)
  return updated.access_token
}

// Fetch accounts and their balances, return normalised array
export async function fetchBankData(accessToken) {
  const accountsRes = await fetch(`${API_URL}/data/v1/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!accountsRes.ok) throw new Error('Failed to fetch accounts')
  const { results: accounts } = await accountsRes.json()

  const accountsWithBalances = await Promise.all(
    accounts.map(async (acc) => {
      const balRes = await fetch(`${API_URL}/data/v1/accounts/${acc.account_id}/balance`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const balance = balRes.ok ? (await balRes.json()).results?.[0] : null
      return {
        id: acc.account_id,
        name: acc.display_name,
        type: acc.account_type,
        currency: acc.currency,
        provider: acc.provider?.display_name || '',
        balance: balance ? {
          available: balance.available,
          current: balance.current,
          updated: balance.update_timestamp,
        } : null,
      }
    })
  )

  return { accounts: accountsWithBalances, synced_at: new Date().toISOString() }
}
