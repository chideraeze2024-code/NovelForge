import connectDB from '../../../lib/db'
import { User } from '../../../lib/models'
import { hashPassword, signToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  await connectDB()
  const { name, email, password } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) return res.status(409).json({ error: 'Email already registered' })
  const isAdmin = email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()
  const hashed = await hashPassword(password)
  const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase()
  const user = await User.create({ name, email: email.toLowerCase(), password: hashed, isAdmin, referralCode })
  const token = signToken({ id: user._id.toString(), email: user.email, name: user.name, isAdmin: user.isAdmin })
  res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } })
}
