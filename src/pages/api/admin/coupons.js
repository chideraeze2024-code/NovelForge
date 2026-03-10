import connectDB from '../../../lib/db'
import { Coupon } from '../../../lib/models'
import { requireAdmin } from '../../../lib/auth'

async function handler(req, res) {
  await connectDB()
  if (req.method === 'GET') { const coupons = await Coupon.find().sort({ createdAt: -1 }); return res.json({ coupons }) }
  if (req.method === 'POST') {
    const { code, discount, usageLimit } = req.body
    if (!code || !discount) return res.status(400).json({ error: 'Code and discount required' })
    const coupon = await Coupon.create({ code: code.toUpperCase(), discount: Number(discount), usageLimit: usageLimit || null })
    return res.status(201).json({ coupon })
  }
  if (req.method === 'PATCH') {
    const { code, active } = req.body
    const coupon = await Coupon.findOneAndUpdate({ code }, { active }, { new: true })
    return res.json({ coupon })
  }
  res.status(405).end()
}

export default requireAdmin(handler)
