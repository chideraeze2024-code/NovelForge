// src/pages/api/auth/login.js
import connectDB from '../../../lib/db'
import { User } from '../../../lib/models'
import { comparePassword, signToken, hashPassword } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  await connectDB()
  const { email, password } = req.body

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' })

  // Check for admin using env vars
  const isEnvAdmin = email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()
    && password === process.env.ADMIN_PASSWORD

  if (isEnvAdmin) {
    // Auto-create admin user in DB if not exists
    let admin = await User.findOne({ email: email.toLowerCase() })
    if (!admin) {
      const hashed = await hashPassword(password)
      admin = await User.create({
        name: 'Admin',
        email: email.toLowerCase(),
        password: hashed,
        isAdmin: true,
        referralCode: 'ADMIN001',
      })
    }
    const token = signToken({ id: admin._id.toString(), email: admin.email, name: admin.name, isAdmin: true })
    await User.findByIdAndUpdate(admin._id, { lastLogin: new Date() })
    return res.json({
      token,
      user: { id: admin._id, name: admin.name, email: admin.email, isAdmin: true },
    })
  }

  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) return res.status(401).json({ error: 'Invalid email or password' })

  const valid = await comparePassword(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() })

  const token = signToken({ id: user._id.toString(), email: user.email, name: user.name, isAdmin: user.isAdmin })

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, referralCode: user.referralCode },
  })
}
