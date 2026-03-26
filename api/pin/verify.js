import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { pin } = req.body || {}
  if (!pin) return res.status(400).json({ error: 'PIN required' })

  const valid = await bcrypt.compare(String(pin), process.env.PIN_HASH || '')
  if (!valid) return res.status(401).json({ error: 'Incorrect PIN' })

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(secret)

  return res.status(200).json({ token })
}
