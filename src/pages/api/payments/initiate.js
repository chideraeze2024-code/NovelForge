import connectDB from '../../../lib/db'
import { Project, Payment, Coupon, User } from '../../../lib/models'
import { requireAuth } from '../../../lib/auth'
import { getPackage } from '../../../lib/pricing'

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  await connectDB()
  const { projectId, chapters, provider, couponCode } = req.body
  const project = await Project.findOne({ _id: projectId, userId: req.user.id })
  if (!project) return res.status(404).json({ error: 'Project not found' })
  const pkg = getPackage(chapters)
  if (!pkg) return res.status(400).json({ error: 'Invalid package' })
  let discountPercent = 0
  let coupon = null
  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true })
    if (coupon) discountPercent = coupon.discount
  }
  const discount = Math.round(pkg.price * (discountPercent / 100))
  const finalPrice = pkg.price - discount
  const reference = `NF-${Date.now()}-${Math.random().toString(36).substring(2,8).toUpperCase()}`
  const payment = await Payment.create({ userId: req.user.id, projectId, reference, provider: provider || 'paystack', chapters, originalPrice: pkg.price, discount, finalPrice, couponCode: coupon?.code || null, status: 'pending' })
  const user = await User.findById(req.user.id)
  if (provider === 'paystack') {
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', { method: 'POST', headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, amount: finalPrice * 100, reference, currency: 'NGN', callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify?ref=${reference}` }) })
    const paystackData = await paystackRes.json()
    if (!paystackData.status) { await Payment.findByIdAndDelete(payment._id); return res.status(500).json({ error: 'Paystack failed' }) }
    return res.json({ paymentUrl: paystackData.data.authorization_url, reference, finalPrice, provider: 'paystack' })
  }
  if (provider === 'flutterwave') {
    const flwRes = await fetch('https://api.flutterwave.com/v3/payments', { method: 'POST', headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ tx_ref: reference, amount: finalPrice, currency: 'NGN', redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify?ref=${reference}`, customer: { email: user.email, name: user.name }, customizations: { title: 'NovelForge AI' } }) })
    const flwData = await flwRes.json()
    if (flwData.status !== 'success') { await Payment.findByIdAndDelete(payment._id); return res.status(500).json({ error: 'Flutterwave failed' }) }
    return res.json({ paymentUrl: flwData.data.link, reference, finalPrice, provider: 'flutterwave' })
  }
  res.status(400).json({ error: 'Invalid provider' })
}

export default requireAuth(handler)
