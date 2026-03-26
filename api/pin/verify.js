import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { Redis } from '@upstash/redis'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)
const redis = new Redis({
  url: process.env.HFSTORE_KV_REST_API_URL,
  token: process.env.HFSTORE_KV_REST_API_TOKEN,
})

const MAX_ATTEMPTS = 5
const LOCKOUT_SECONDS = 15 * 60 // 15 minutes

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  const rateLimitKey = `pin:attempts:${ip}`

  const attempts = (await redis.get(rateLimitKey)) || 0
  if (attempts >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' })
  }

  const { pin } = req.body || {}
  if (!pin) return res.status(400).json({ error: 'PIN required' })

  const valid = await bcrypt.compare(String(pin), process.env.PIN_HASH || '')

  if (!valid) {
    await redis.incr(rateLimitKey)
    await redis.expire(rateLimitKey, LOCKOUT_SECONDS)
    return res.status(401).json({ error: 'Incorrect PIN' })
  }

  await redis.del(rateLimitKey)

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(secret)

  return res.status(200).json({ token })
}
