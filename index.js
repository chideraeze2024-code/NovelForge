// src/pages/admin/index.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import TopBar from '../../components/TopBar'
import Notification, { notify } from '../../components/Notification'
import { useAuth } from '../_app'
import { GENRES } from '../../lib/pricing'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, apiFetch } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [newCoupon, setNewCoupon] = useState({ code:'', discount:10, usageLimit:'' })
  const [savingCoupon, setSavingCoupon] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/auth'); return }
    if (!user.isAdmin) { router.push('/dashboard'); return }
    fetchStats()
  }, [user])

  const fetchStats = async () => {
    try {
      const res = await apiFetch('/api/admin/stats')
      const d = await res.json()
      setData(d)
    } catch {
      notify('Failed to load admin data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const addCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discount) { notify('Code and discount required', 'error'); return }
    setSavingCoupon(true)
    try {
      const res = await apiFetch('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: newCoupon.code,
          discount: Number(newCoupon.discount),
          usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : null,
        }),
      })
      const d = await res.json()
      if (!res.ok) { notify(d.error, 'error'); return }
      setData(prev => ({ ...prev, coupons: [d.coupon, ...(prev.coupons || [])] }))
      setNewCoupon({ code:'', discount:10, usageLimit:'' })
      notify('Coupon created!')
    } catch {
      notify('Failed to create coupon', 'error')
    } finally {
      setSavingCoupon(false)
    }
  }

  const toggleCoupon = async (code, active) => {
    try {
      const res = await apiFetch('/api/admin/coupons', {
        method: 'PATCH',
        body: JSON.stringify({ code, active: !active }),
      })
      const d = await res.json()
      setData(prev => ({ ...prev, coupons: prev.coupons.map(c => c.code === code ? d.coupon : c) }))
      notify(`Coupon ${!active ? 'activated' : 'deactivated'}`)
    } catch {
      notify('Failed to update coupon', 'error')
    }
  }

  if (!user || loading) return (
    <div>
      <TopBar />
      <div style={{ minHeight:'calc(100vh - 64px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="spinner" style={{ width:40, height:40 }} />
      </div>
    </div>
  )

  const { stats, recentPayments, users, coupons, monthlyRevenue } = data || {}
  const tabs = ['overview','payments','users','coupons']

  return (
    <div>
      <TopBar />
      <Notification />
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'40px 24px' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:36, flexWrap:'wrap', gap:16 }}>
          <div>
            <h1 className="playfair" style={{ fontSize:34, fontWeight:700, color:'var(--accent)' }}>Admin Dashboard</h1>
            <p style={{ color:'var(--muted)', fontSize:13, marginTop:4 }}>NovelForge AI — Owner Control Panel</p>
          </div>
          <button className="btn-ghost" style={{ fontSize:13, padding:'9px 18px' }} onClick={fetchStats}>🔄 Refresh</button>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16, marginBottom:36 }}>
          {[
            ['👥', stats?.totalUsers || 0, 'Total Users', ''],
            ['📚', stats?.totalProjects || 0, 'Total Projects', ''],
            ['✅', stats?.totalPayments || 0, 'Completed Payments', ''],
            ['💰', `₦${(stats?.totalRevenue || 0).toLocaleString()}`, 'Total Revenue', 'color:var(--accent)'],
          ].map(([icon,val,label]) => (
            <div key={label} className="card" style={{ textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>{icon}</div>
              <div className="playfair" style={{ fontSize:26, fontWeight:900, color:'var(--accent)' }}>{val}</div>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Monthly Revenue */}
        {monthlyRevenue && Object.keys(monthlyRevenue).length > 0 && (
          <div className="card" style={{ marginBottom:32 }}>
            <div style={{ fontWeight:700, marginBottom:16, fontSize:15 }}>Monthly Revenue</div>
            <div style={{ display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
              {Object.entries(monthlyRevenue).sort().map(([month, amount]) => {
                const maxAmt = Math.max(...Object.values(monthlyRevenue))
                const height = Math.max(20, Math.round((amount / maxAmt) * 120))
                return (
                  <div key={month} style={{ textAlign:'center', flex:'1 0 60px' }}>
                    <div style={{ fontSize:11, color:'var(--accent)', fontWeight:600, marginBottom:4 }}>
                      ₦{(amount/1000).toFixed(0)}k
                    </div>
                    <div style={{ width:'100%', height, background:'linear-gradient(to top, var(--accent), #E8A020)', borderRadius:'4px 4px 0 0', minWidth:40 }} />
                    <div style={{ fontSize:10, color:'var(--muted)', marginTop:4 }}>{month.substring(5)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap', borderBottom:'1px solid var(--border)', paddingBottom:0 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'10px 22px', borderRadius:'8px 8px 0 0', fontWeight:500, fontSize:13,
              background: tab===t ? 'var(--surface)' : 'transparent',
              color: tab===t ? 'var(--accent)' : 'var(--muted)',
              border: tab===t ? '1px solid var(--border)' : '1px solid transparent',
              borderBottom: tab===t ? '1px solid var(--surface)' : 'none',
              cursor:'pointer', textTransform:'capitalize', marginBottom:-1,
            }}>
              {t === 'overview' ? '📊' : t === 'payments' ? '💰' : t === 'users' ? '👥' : '🏷️'} {t}
            </button>
          ))}
        </div>

        {/* Overview - Recent Payments */}
        {tab === 'overview' && (
          <div>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>Recent Payments</div>
            {!recentPayments?.length ? (
              <div className="card" style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>No payments yet</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {recentPayments.map(p => (
                  <div key={p._id} className="card" style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap', padding:'16px 20px' }}>
                    <div style={{ flex:1, minWidth:180 }}>
                      <div style={{ fontWeight:600 }}>{p.userId?.name || 'User'}</div>
                      <div style={{ fontSize:12, color:'var(--muted)' }}>{p.userId?.email}</div>
                      <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>
                        {new Date(p.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:13 }}>{p.projectId?.title || 'Novel'}</div>
                      <div style={{ fontSize:12, color:'var(--muted)' }}>
                        {GENRES.find(g=>g.id===p.projectId?.genre)?.label} · {p.chapters} chapters
                      </div>
                      {p.couponCode && <div style={{ fontSize:11, color:'var(--green-light)' }}>Coupon: {p.couponCode}</div>}
                    </div>
                    <div style={{ textAlign:'right', marginLeft:'auto' }}>
                      <div style={{ fontWeight:700, fontSize:18, color:'var(--accent)' }}>₦{p.finalPrice.toLocaleString()}</div>
                      {p.discount > 0 && <div style={{ fontSize:11, color:'var(--muted)' }}>was ₦{p.originalPrice.toLocaleString()}</div>}
                      <span className="tag" style={{ background:'color-mix(in srgb, #4CAF50 15%, transparent)', color:'#4CAF50', marginTop:4 }}>Paid</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Payments */}
        {tab === 'payments' && (
          <div>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>
              All Payments · Total: ₦{(stats?.totalRevenue || 0).toLocaleString()}
            </div>
            {!recentPayments?.length ? (
              <div className="card" style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>No payments yet</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {recentPayments.map(p => (
                  <div key={p._id} className="card" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:12, alignItems:'center', padding:'16px 20px' }}>
                    <div>
                      <div style={{ fontWeight:600 }}>{p.userId?.name}</div>
                      <div style={{ fontSize:12, color:'var(--muted)' }}>{p.userId?.email}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:13 }}>{p.projectId?.title}</div>
                      <div style={{ fontSize:12, color:'var(--muted)' }}>{p.chapters} chapters · {p.provider}</div>
                    </div>
                    <div style={{ fontSize:12, color:'var(--muted)' }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                      {p.couponCode && <div style={{ color:'var(--green-light)' }}>🏷 {p.couponCode} (-{p.discount}%)</div>}
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:700, color:'var(--accent)', fontSize:16 }}>₦{p.finalPrice.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>All Users ({users?.length || 0})</div>
            {!users?.length ? (
              <div className="card" style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>No users yet</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {users.map(u => (
                  <div key={u._id} className="card" style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap', padding:'16px 20px' }}>
                    <div style={{
                      width:44, height:44, borderRadius:12, flexShrink:0,
                      background:'color-mix(in srgb, var(--accent) 18%, transparent)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:18, fontWeight:700, color:'var(--accent)',
                    }}>
                      {u.name[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600 }}>{u.name}</div>
                      <div style={{ fontSize:12, color:'var(--muted)' }}>{u.email}</div>
                      <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>
                        Joined {new Date(u.createdAt).toLocaleDateString()} · Ref: {u.referralCode}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontWeight:700, color:'var(--accent)' }}>₦{(u.totalSpent || 0).toLocaleString()}</div>
                        <div style={{ fontSize:11, color:'var(--muted)' }}>spent</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Coupons */}
        {tab === 'coupons' && (
          <div>
            <div className="card" style={{ marginBottom:24 }}>
              <div style={{ fontWeight:700, marginBottom:16, fontSize:15 }}>Create New Coupon</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
                <div>
                  <label style={{ fontSize:12, color:'var(--muted)', fontWeight:600, marginBottom:6, display:'block' }}>COUPON CODE</label>
                  <input placeholder="e.g. SAVE20" value={newCoupon.code} onChange={e => setNewCoupon(c=>({...c,code:e.target.value.toUpperCase()}))} />
                </div>
                <div>
                  <label style={{ fontSize:12, color:'var(--muted)', fontWeight:600, marginBottom:6, display:'block' }}>DISCOUNT %</label>
                  <input type="number" placeholder="10" value={newCoupon.discount} onChange={e => setNewCoupon(c=>({...c,discount:e.target.value}))} min={1} max={100} />
                </div>
                <div>
                  <label style={{ fontSize:12, color:'var(--muted)', fontWeight:600, marginBottom:6, display:'block' }}>USAGE LIMIT <span style={{ fontWeight:400 }}>(blank = unlimited)</span></label>
                  <input type="number" placeholder="Unlimited" value={newCoupon.usageLimit} onChange={e => setNewCoupon(c=>({...c,usageLimit:e.target.value}))} min={1} />
                </div>
                <button className="btn-gold" onClick={addCoupon} disabled={savingCoupon} style={{ padding:'12px 20px' }}>
                  {savingCoupon ? '…' : '+ Add'}
                </button>
              </div>
            </div>

            {!coupons?.length ? (
              <div className="card" style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>No coupons yet</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {coupons.map(c => (
                  <div key={c.code} className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, padding:'16px 20px' }}>
                    <div>
                      <span style={{ fontWeight:800, fontSize:18, letterSpacing:3, color:'var(--accent)' }}>{c.code}</span>
                      <span style={{ marginLeft:16, color:'var(--muted)', fontSize:14 }}>{c.discount}% off</span>
                      <div style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>
                        Used: {c.usageCount}/{c.usageLimit || '∞'} times
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <span className="tag" style={{
                        background: c.active ? 'color-mix(in srgb, #4CAF50 15%, transparent)' : 'color-mix(in srgb, var(--red) 15%, transparent)',
                        color: c.active ? '#4CAF50' : 'var(--red)',
                      }}>
                        {c.active ? '● Active' : '○ Disabled'}
                      </span>
                      <button className="btn-ghost" style={{ padding:'8px 16px', fontSize:13 }}
                        onClick={() => toggleCoupon(c.code, c.active)}>
                        {c.active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
