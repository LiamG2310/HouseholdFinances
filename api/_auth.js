import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export async function verifyAuth(req) {
  const auth = req.headers['authorization'] || ''
  if (!auth.startsWith('Bearer ')) return null
  try {
    const { payload } = await jwtVerify(auth.slice(7), secret)
    return payload
  } catch {
    return null
  }
}
