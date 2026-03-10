// src/pages/auth.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import TopBar from '../components/TopBar'
import Notification, { notify } from '../components/Notification'
import { useAuth } from './_app'

export default function AuthPage() {
  const router = useRouter()
  const { login, user } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name:'', email:'', password:'', referral:'' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (router.query.mode === 'register') setMode('register')
    if (user) router.push(user.isAdmin ? '/admin' : '/dashboard')
  }, [router.query, user])

  const set = (k, v) => setForm(f => ({...f, [k]:v}))

  const submit = async () => {
    if (!form.email || !form.password) { notify('Email and password required', 'error'); return }
    if (mode === 'register' && !form.name) { notify('Name is required', 'error'); return }
    if (mode === 'register' && form.password.length < 6) { notify('Password must be at least 6 characters', 'error'); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          referralCode: form.referral || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { notify(data.error || 'Something went wrong', 'error'); return }

      login(data.user, data.token)
      notify(`Welcome${mode === 'register' ? ' to NovelForge AI' : ' back'}, ${data.user.name}!`)
      setTimeout(() => router.push(data.user.isAdmin ? '/admin' : '/dashboard'), 600)
    } catch (err) {
      notify('Network error. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <TopBar />
      <Notification />
      <div style={{ minHeight:'calc(100vh - 64px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div className="card fade-in" style={{ width:'100%', maxWidth:440 }}>

          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📖</div>
            <h2 className="playfair" style={{ fontSize:30, fontWeight:700, color:'var(--accent)' }}>
              {mode === 'register' ? 'Create Your Account' : 'Welcome Back'}
            </h2>
            <p style={{ color:'var(--muted)', fontSize:14, marginTop:8 }}>
              {mode === 'register' ? 'Start generating bestselling webnovels today' : 'Sign in to continue writing'}
            </p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {mode === 'register' && (
              <div>
                <label style={{ fontSize:12, color:'var(--muted)', fontWeight:600, marginBottom:6, display:'block' }}>YOUR NAME</label>
                <input placeholder="Full Name" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
            )}
            <div>
              <label style={{ fontSize:12, color:'var(--muted)', fontWeight:600, marginBottom:6, display:'block' }}>EMAIL ADDRESS</label>
              <input placeholder="you@example.com" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize:12, color:'var(--muted)', fontWeight:600, marginBottom:6, display:'block' }}>PASSWORD</label>
              <input placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'} type="password" value={form.password} onChange={e => set('password', e.target.value)} onKeyDown={e => e.key==='Enter' && submit()} />
            </div>
            {mode === 'register' && (
              <div>
                <label style={{ fontSize:12, color:'var(--muted)', fontWeight:600, marginBottom:6, display:'block' }}>REFERRAL CODE <span style={{ fontWeight:400 }}>(optional)</span></label>
                <input placeholder="Enter referral code" value={form.referral} onChange={e => set('referral', e.target.value)} />
              </div>
            )}

            <button className="btn-gold" style={{ width:'100%', padding:15, fontSize:16, marginTop:4 }} onClick={submit} disabled={loading}>
              {loading
                ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><span className="spinner" style={{ width:18, height:18 }} /> Processing…</span>
                : mode === 'register' ? 'Create Account →' : 'Sign In →'
              }
            </button>
          </div>

          <p style={{ textAlign:'center', marginTop:24, fontSize:13, color:'var(--muted)' }}>
            {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <span
              style={{ color:'var(--accent)', cursor:'pointer', fontWeight:600 }}
              onClick={() => { setMode(mode==='register'?'login':'register'); setForm({name:'',email:'',password:'',referral:''}) }}
            >
              {mode === 'register' ? 'Sign In' : 'Register Free'}
            </span>
          </p>

          <Link href="/" style={{ display:'block', textAlign:'center', marginTop:16 }}>
            <span style={{ fontSize:13, color:'var(--muted)', textDecoration:'none' }}>← Back to home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
