import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret'

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

export function requireAuth(handler) {
  return async (req, res) => {
    const token = getTokenFromRequest(req)
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const decoded = verifyToken(token)
    if (!decoded) return res.status(401).json({ error: 'Invalid token' })
    req.user = decoded
    return handler(req, res)
  }
}

export function requireAdmin(handler) {
  return async (req, res) => {
    const token = getTokenFromRequest(req)
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const decoded = verifyToken(token)
    if (!decoded || !decoded.isAdmin) return res.status(403).json({ error: 'Admin only' })
    req.user = decoded
    return handler(req, res)
  }
}
