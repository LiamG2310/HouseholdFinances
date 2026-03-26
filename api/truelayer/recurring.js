import { verifyAuth } from '../_auth.js'
import { redis, getValidAccessToken, API_URL } from '../_truelayer.js'

function mapFrequency(freq) {
  const map = {
    Monthly: 'monthly', Weekly: 'weekly', Fortnightly: 'fortnightly',
    Quarterly: 'quarterly', Annual: 'annual', Annually: 'annual', Yearly: 'annual',
  }
  return map[freq] || 'monthly'
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const user = await verifyAuth(req)
  if (!user) return res.status(401).json({ error: 'Unauthorised' })

  const accessToken = await getValidAccessToken()
  if (!accessToken) return res.status(401).json({ error: 'Bank connection expired. Please reconnect.' })

  const data = await redis.get('tl:data')
  const accountId = data?.accounts?.[0]?.id
  if (!accountId) return res.status(400).json({ error: 'No account found. Please sync bank data first.' })

  const [ddRes, soRes] = await Promise.all([
    fetch(`${API_URL}/data/v1/accounts/${accountId}/direct_debits`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch(`${API_URL}/data/v1/accounts/${accountId}/standing_orders`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ])

  const directDebits = ddRes.ok ? ((await ddRes.json()).results || []) : []
  const standingOrders = soRes.ok ? ((await soRes.json()).results || []) : []

  return res.status(200).json({
    directDebits: directDebits.map(dd => ({
      id: dd.direct_debit_id || dd.name,
      name: dd.name,
      amount: dd.previous_payment_amount ?? null,
      frequency: mapFrequency(dd.frequency),
    })),
    standingOrders: standingOrders.map(so => ({
      id: so.standing_order_id || so.reference,
      name: so.payee || so.reference,
      amount: so.amount ?? null,
      frequency: mapFrequency(so.frequency),
    })),
  })
}
