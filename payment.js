// src/pages/payment.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import TopBar from '../components/TopBar'
import Notification, { notify } from '../components/Notification'
import { useAuth } from './_app'
import { PACKAGES, GENRES } from '../lib/pricing'

export default function PaymentPage() {
  const router = useRouter()
  const { user, apiFetch } = useAuth()
  const [project, setProject] = useState(null)
  const [selectedPkg, setSelectedPkg] = useState(PACKAGES[0])
  const [coupon, setCoupon] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [provider, setProvider] = useState('paystack')
  const [loading, setLoading] = useState(false)
  const [loadingProject, setLoadingProject] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/auth'); return }
    const id = router.query.project
    if (id) fetchProject(id)
  }, [user, router.query])

  const fetchProject = async (id) => {
    try {
      const res = await apiFetch(`/api/projects/${id}`)
      const data = await res.json()
      setProject(data.project)
      if (data.project.paid) router.push(`/editor/${id}`)
    } catch (err) {
      notify('Project not found', 'error')
      router.push('/dashboard')
    } finally {
      setLoadingProject(false)
    }
  }

  const applyCoupon = async () => {
    if (!coupon) return
    try {
      const res = await apiFetch('/api/payments/validate-coupon', {
        method: 'POST',
        body: JSON.stringify({ code: coupon }),
      })
      const data = await res.json()
      if (!res.ok) { notify(data.error, 'error'); return }
      setAppliedCoupon(data)
      notify(`Coupon applied! ${data.discount}% off`)
    } catch {
      notify('Invalid coupon', 'error')
    }
  }

  const discount = appliedCoupon?.discount || 0
  const finalPrice = Math.round(selectedPkg.price * (1 - discount/100))

  const pay = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({
          projectId: project._id,
          chapters: selectedPkg.chapters,
          provider,
          couponCode: appliedCoupon?.code || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { notify(data.error || 'Payment initiation failed', 'error'); return }
      window.location.href = data.paymentUrl
    } catch (err) {
      notify('Payment error. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!user || loadingProject) return (
    <div>
      <TopBar />
      <div style={{ minHeight:'calc(100vh - 64px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="spinner" style={{ width:40, height:40 }} />
      </div>
    </div>
  )

  const genre = GENRES.find(g => g.id === project?.genre)

  return (
    <div>
      <TopBar />
      <Notification />
      <div style={{ maxWidth:640, margin:'0 auto', padding:'40px 24px' }}>

        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:32 }}>
          <button className="btn-ghost" style={{ padding:'8px 14px', fontSize:13 }} onClick={() => router.push('/dashboard')}>← Back</button>
          <h1 className="playfair" style={{ fontSize:28, fontWeight:700 }}>Choose Your Package</h1>
        </div>

        {/* Project info */}
        <div className="card" style={{ marginBottom:20, display:'flex', gap:14, alignItems:'center' }}>
          <div style={{ fontSize:36 }}>{genre?.emoji}</div>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>{project?.title}</div>
            <div style={{ color:'var(--muted)', fontSize:13 }}>{genre?.label}</div>
          </div>
        </div>

        {/* Packages */}
        <div style={{ marginBottom:24 }}>
          <label style={{ fontSize:12, color:'var(--muted)', fontWeight:600, marginBottom:12, display:'block' }}>SELECT CHAPTER PACKAGE</label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(108px,1fr))', gap:10 }}>
            {PACKAGES.map((pkg, i) => (
              <div key={pkg.chapters} onClick={() => setSelectedPkg(pkg)} style={{
                padding:'16px 10px', borderRadius:12, cursor:'pointer', textAlign:'center',
                border:`2px solid ${selectedPkg.chapters===pkg.chapters ? 'var(--accent)' : 'var(--border)'}`,
                background: selectedPkg.chapters===pkg.chapters ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--surface)',
                transition:'all 0.15s', position:'relative',
              }}>
                {i===2 && <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', background:'var(--accent)', color:'#0D0B12', fontSize:9, fontWeight:700, padding:'2px 10px', borderRadius:20, whiteSpace:'nowrap' }}>POPULAR</div>}
                <div className="playfair" style={{ fontSize:26, fontWeight:900, color:'var(--accent)' }}>{pkg.chapters}</div>
                <div style={{ fontSize:10, color:'var(--muted)', marginBottom:4 }}>chapters</div>
                <div style={{ fontWeight:700, fontSize:13 }}>₦{pkg.price.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Coupon */}
        <div className="card" style={{ marginBottom:20 }}>
          <div style={{ fontWeight:600, marginBottom:12, fontSize:14 }}>Coupon Code</div>
          <div style={{ display:'flex', gap:10 }}>
            <input placeholder="Enter coupon code" value={coupon} onChange={e => setCoupon(e.target.value)} style={{ flex:1 }} />
            <button className="btn-ghost" style={{ whiteSpace:'nowrap', padding:'11px 20px' }} onClick={applyCoupon}>Apply</button>
          </div>
          {appliedCoupon && (
            <div style={{ color:'var(--green-light)', fontSize:13, marginTop:10, fontWeight:600 }}>
              ✓ {appliedCoupon.discount}% discount applied!
            </div>
          )}
        </div>

        {/* Payment method */}
        <div className="card" style={{ marginBottom:20 }}>
          <div style={{ fontWeight:600, marginBottom:12, fontSize:14 }}>Payment Method</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[['paystack','💳 Paystack'],['flutterwave','🦋 Flutterwave']].map(([id,label]) => (
              <div key={id} onClick={() => setProvider(id)} style={{
                padding:'16px', border:`2px solid ${provider===id ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius:12, cursor:'pointer', textAlign:'center', fontWeight:600, fontSize:14,
                background: provider===id ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                transition:'all 0.15s',
              }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="card" style={{ marginBottom:24 }}>
          <div style={{ fontWeight:700, marginBottom:14, fontSize:15 }}>Order Summary</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
              <span style={{ color:'var(--muted)' }}>{selectedPkg.chapters} chapters ({selectedPkg.label})</span>
              <span>₦{selectedPkg.price.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, color:'var(--green-light)' }}>
                <span>Coupon discount ({discount}%)</span>
                <span>−₦{(selectedPkg.price - finalPrice).toLocaleString()}</span>
              </div>
            )}
            <div style={{ height:1, background:'var(--border)', margin:'4px 0' }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:20 }}>
              <span>Total</span>
              <span style={{ color:'var(--accent)' }}>₦{finalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button className="btn-gold" style={{ width:'100%', padding:17, fontSize:17 }} onClick={pay} disabled={loading}>
          {loading
            ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><span className="spinner" style={{ width:18, height:18 }} /> Redirecting to payment…</span>
            : `Pay ₦${finalPrice.toLocaleString()} via ${provider === 'paystack' ? 'Paystack' : 'Flutterwave'} →`
          }
        </button>
        <p style={{ textAlign:'center', color:'var(--muted)', fontSize:12, marginTop:12 }}>
          🔒 Secured by {provider === 'paystack' ? 'Paystack' : 'Flutterwave'} · Your chapters unlock immediately after payment
        </p>
      </div>
    </div>
  )
}
