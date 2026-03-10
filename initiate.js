// src/pages/api/payments/initiate.js
import connectDB from '../../../lib/db'
import { Project, Payment, Coupon, User } from '../../../lib/models'
import { requireAuth } from '../../../lib/auth'
import { getPackage } from '../../../lib/pricing'
import { v4 as uuidv4 } from 'uuid'

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  await connectDB()
  const { projectId, chapters, provider, couponCode } = req.body

  const project = await Project.findOne({ _id: projectId, userId: req.user.id })
  if (!project) return res.status(404).json({ error: 'Project not found' })

  const pkg = getPackage(chapters)
  if (!pkg) return res.status(400).json({ error: 'Invalid chapter package' })

  // Apply coupon
  let discountPercent = 0
  let coupon = null
  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true })
    if (coupon) {
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return res.status(400).json({ error: 'Coupon usage limit reached' })
      }
      if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        return res.status(400).json({ error: 'Coupon has expired' })
      }
      discountPercent = coupon.discount
    } else {
      return res.status(400).json({ error: 'Invalid or inactive coupon' })
    }
  }

  const discount = Math.round(pkg.price * (discountPercent / 100))
  const finalPrice = pkg.price - discount
  const reference = `NF-${uuidv4().substring(0, 12).toUpperCase()}`

  // Create pending payment record
  const payment = await Payment.create({
    userId: req.user.id,
    projectId,
    reference,
    provider: provider || 'paystack',
    chapters,
    originalPrice: pkg.price,
    discount,
    finalPrice,
    couponCode: coupon?.code || null,
    status: 'pending',
  })

  const user = await User.findById(req.user.id)

  if (provider === 'paystack') {
    // Initialize Paystack transaction
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: finalPrice * 100, // Paystack uses kobo
        reference,
        currency: 'NGN',
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify?ref=${reference}`,
        metadata: {
          paymentId: payment._id.toString(),
          projectId,
          chapters,
          userId: req.user.id,
        },
      }),
    })

    const paystackData = await paystackRes.json()
    if (!paystackData.status) {
      await Payment.findByIdAndDelete(payment._id)
      return res.status(500).json({ error: 'Paystack initialization failed' })
    }

    return res.json({
      paymentUrl: paystackData.data.authorization_url,
      reference,
      finalPrice,
      provider: 'paystack',
    })
  }

  if (provider === 'flutterwave') {
    const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount: finalPrice,
        currency: 'NGN',
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify?ref=${reference}`,
        customer: { email: user.email, name: user.name },
        customizations: { title: 'NovelForge AI', description: `${chapters} chapter package` },
        meta: { paymentId: payment._id.toString(), projectId, chapters, userId: req.user.id },
      }),
    })

    const flwData = await flwRes.json()
    if (flwData.status !== 'success') {
      await Payment.findByIdAndDelete(payment._id)
      return res.status(500).json({ error: 'Flutterwave initialization failed' })
    }

    return res.json({
      paymentUrl: flwData.data.link,
      reference,
      finalPrice,
      provider: 'flutterwave',
    })
  }

  res.status(400).json({ error: 'Invalid payment provider' })
}

export default requireAuth(handler)
