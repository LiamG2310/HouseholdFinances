import { verifyAuth } from '../_auth.js'
import { redis, getValidAccessToken, API_URL } from '../_truelayer.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const user = await verifyAuth(req)
  if (!user) return res.status(401).json({ error: 'Unauthorised' })

  const year  = parseInt(req.query.year  || new Date().getFullYear())
  const month = parseInt(req.query.month || new Date().getMonth() + 1)

  const cacheKey = `tl:transactions:${year}-${month}`
  const cached = await redis.get(cacheKey)
  if (cached) return res.status(200).json({ transactions: cached })

  const accessToken = await getValidAccessToken()
  if (!accessToken) return res.status(401).json({ error: 'Bank connection expired. Please reconnect.' })

  const data = await redis.get('tl:data')
  const accountId = data?.accounts?.[0]?.id
  if (!accountId) return res.status(400).json({ error: 'No account found. Please sync bank data first.' })

  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0)
  const to = (lastDay < new Date() ? lastDay : new Date()).toISOString().split('T')[0]

  const tlRes = await fetch(
    `${API_URL}/data/v1/accounts/${accountId}/transactions?from=${from}&to=${to}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!tlRes.ok) return res.status(502).json({ error: 'Failed to fetch transactions' })

  const { results } = await tlRes.json()
  const transactions = (results || []).map(t => ({
    id: t.transaction_id,
    date: t.timestamp,
    description: t.merchant_name || t.description,
    amount: t.amount,
    currency: t.currency,
    category: t.transaction_category,
    type: t.transaction_type,
  }))

  // Cache for 10 minutes for current month, 24 hours for past months
  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  await redis.set(cacheKey, transactions, { ex: isCurrentMonth ? 600 : 86400 })

  return res.status(200).json({ transactions })
}
