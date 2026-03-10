import connectDB from '../../../lib/db'
import { User, Project, Payment, Coupon } from '../../../lib/models'
import { requireAdmin } from '../../../lib/auth'

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  await connectDB()
  const [totalUsers, totalProjects, payments, recentPayments, users, coupons] = await Promise.all([
    User.countDocuments({ isAdmin: false }),
    Project.countDocuments(),
    Payment.find({ status: 'completed' }).select('finalPrice createdAt'),
    Payment.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(20).populate('userId', 'name email').populate('projectId', 'title genre'),
    User.find({ isAdmin: false }).sort({ createdAt: -1 }).select('-password'),
    Coupon.find().sort({ createdAt: -1 }),
  ])
  const totalRevenue = payments.reduce((s, p) => s + p.finalPrice, 0)
  const totalPayments = payments.length
  res.json({ stats: { totalUsers, totalProjects, totalPayments, totalRevenue }, recentPayments, users, coupons })
}

export default requireAdmin(handler)
