import { verifyAuth } from './_auth.js'
import { redis } from './_truelayer.js'

const KEY = 'hf:learned_links'

export default async function handler(req, res) {
  const user = await verifyAuth(req)
  if (!user) return res.status(401).json({ error: 'Unauthorised' })

  if (req.method === 'GET') {
    const links = await redis.get(KEY) || {}
    return res.status(200).json({ links })
  }

  if (req.method === 'POST') {
    const { txKey, billId } = req.body
    if (!txKey || !billId) return res.status(400).json({ error: 'Missing txKey or billId' })
    const links = await redis.get(KEY) || {}
    links[txKey] = billId
    await redis.set(KEY, links)
    return res.status(200).json({ links })
  }

  return res.status(405).end()
}
