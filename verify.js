// src/pages/api/payments/verify.js
import connectDB from '../../../lib/db'
import { Project, Payment, Coupon, User } from '../../../lib/models'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()

  await connectDB()
  const reference = req.query.ref || req.body?.reference
  if (!reference) return res.status(400).json({ error: 'Reference required' })

  const payment = await Payment.findOne({ reference })
  if (!payment) return res.status(404).json({ error: 'Payment not found' })
  if (payment.status === 'completed') return res.json({ success: true, payment })

  let verified = false

  if (payment.provider === 'paystack') {
    const r = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    })
    const data = await r.json()
    verified = data.data?.status === 'success'
  }

  if (payment.provider === 'flutterwave') {
    const r = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`, {
      headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
    })
    const data = await r.json()
    verified = data.data?.status === 'successful'
  }

  if (!verified) {
    await Payment.findByIdAndUpdate(payment._id, { status: 'failed' })
    return res.status(400).json({ error: 'Payment verification failed' })
  }

  // Mark payment complete
  await Payment.findByIdAndUpdate(payment._id, {
    status: 'completed',
    completedAt: new Date(),
  })

  // Unlock project
  await Project.findByIdAndUpdate(payment.projectId, {
    paid: true,
    maxChapters: payment.chapters,
    paymentId: payment._id,
    updatedAt: new Date(),
  })

  // Update user total spent
  await User.findByIdAndUpdate(payment.userId, {
    $inc: { totalSpent: payment.finalPrice },
  })

  // Increment coupon usage
  if (payment.couponCode) {
    await Coupon.findOneAndUpdate({ code: payment.couponCode }, { $inc: { usageCount: 1 } })
  }

  res.json({ success: true, payment, projectId: payment.projectId })
}
