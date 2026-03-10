// src/pages/api/admin/stats.js
import connectDB from '../../../lib/db'
import { User, Project, Payment, Coupon } from '../../../lib/models'
import { requireAdmin } from '../../../lib/auth'

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  await connectDB()

  const [
    totalUsers,
    totalProjects,
    totalPayments,
    payments,
    recentPayments,
    users,
    coupons,
  ] = await Promise.all([
    User.countDocuments({ isAdmin: false }),
    Project.countDocuments(),
    Payment.countDocuments({ status: 'completed' }),
    Payment.find({ status: 'completed' }).select('finalPrice createdAt'),
    Payment.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('userId', 'name email')
      .populate('projectId', 'title genre'),
    User.find({ isAdmin: false }).sort({ createdAt: -1 }).select('-password'),
    Coupon.find().sort({ createdAt: -1 }),
  ])

  const totalRevenue = payments.reduce((s, p) => s + p.finalPrice, 0)

  // Revenue by month (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const monthlyPayments = await Payment.find({
    status: 'completed',
    createdAt: { $gte: sixMonthsAgo },
  })

  const monthlyRevenue = {}
  monthlyPayments.forEach(p => {
    const key = p.createdAt.toISOString().substring(0, 7)
    monthlyRevenue[key] = (monthlyRevenue[key] || 0) + p.finalPrice
  })

  res.json({
    stats: { totalUsers, totalProjects, totalPayments, totalRevenue },
    recentPayments,
    users,
    coupons,
    monthlyRevenue,
  })
}

export default requireAdmin(handler)
