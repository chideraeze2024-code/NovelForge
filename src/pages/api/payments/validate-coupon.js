import connectDB from '../../../lib/db'
import { Coupon } from '../../../lib/models'
import { requireAuth } from '../../../lib/auth'

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  await connectDB()
  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'Code required' })
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true })
  if (!coupon) return res.status(404).json({ error: 'Invalid or expired coupon' })
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return res.status(400).json({ error: 'Coupon limit reached' })
  res.json({ valid: true, discount: coupon.discount, code: coupon.code })
}

export default requireAuth(handler)
