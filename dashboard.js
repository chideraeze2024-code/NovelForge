// src/pages/dashboard.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import TopBar from '../components/TopBar'
import Notification, { notify } from '../components/Notification'
import { useAuth } from './_app'
import { GENRES } from '../lib/pricing'

export default function Dashboard() {
  const router = useRouter()
  const { user, apiFetch } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title:'', genre:'', idea:'' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/auth'); return }
    if (user.isAdmin) { router.push('/admin'); return }
    fetchProjects()
  }, [user])

  const fetchProjects = async () => {
    try {
      const res = await apiFetch('/api/projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (err) {
      notify('Failed to load projects', 'error')
    } finally {
      setLoading(false)
    }
  }

  const createProject = async () => {
    if (!form.genre) { notify('Please select a genre', 'error'); return }
    setCreating(true)
    try {
      const res = await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ title: form.title, genre: form.genre, idea: form.idea }),
      })
      const data = await res.json()
      if (!res.ok) { notify(data.error, 'error'); return }
      setShowNew(false)
      router.push(`/payment?project=${data.project._id}`)
    } catch (err) {
      notify('Failed to create project', 'error')
    } finally {
      setCreating(false)
    }
  }

  const deleteProject = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this novel project? This cannot be undone.')) return
    await apiFetch(`/api/projects/${id}`, { method: 'DELETE' })
    setProjects(p => p.filter(x => x._id !== id))
    notify('Project deleted')
  }

  if (!user) return null

  const totalChapters = projects.reduce((s, p) => s + (p.chapters?.length || 0), 0)

  return (
    <div>
      <TopBar />
      <Notification />

      <div style={{ maxWidth:980, margin:'0 auto', padding:'40px 24px' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:36, flexWrap:'wrap', gap:16 }}>
          <div>
            <h1 className="playfair" style={{ fontSize:34, fontWeight:700 }}>My Novels</h1>
            <p style={{ color:'var(--muted)', fontSize:14, marginTop:5 }}>Welcome back, {user.name} 👋</p>
          </div>
          <button className="btn-gold" style={{ padding:'12px 28px', fontSize:15 }} onClick={() => setShowNew(true)}>
            + New Novel
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:16, marginBottom:40 }}>
          {[
            ['📚', projects.length, 'Total Novels'],
            ['✅', projects.filter(p=>p.paid).length, 'Active Projects'],
            ['📝', totalChapters, 'Chapters Written'],
            ['🔥', projects.filter(p=>p.status==='complete').length, 'Completed'],
          ].map(([icon,val,label]) => (
            <div key={label} className="card" style={{ textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
              <div className="playfair" style={{ fontSize:28, fontWeight:900, color:'var(--accent)' }}>{val}</div>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* New Project Modal */}
        {showNew && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24, backdropFilter:'blur(4px)' }}>
            <div className="card fade-in" style={{ width:'100%', maxWidth:540 }}>
              <h3 className="playfair" style={{ fontSize:26, fontWeight:700, color:'var(--accent)', marginBottom:6 }}>
                New Novel Project
              </h3>
              <p style={{ color:'var(--muted)', fontSize:13, marginBottom:24 }}>
                Set up your novel — AI generates everything from here
              </p>

              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div>
                  <label style={{ fontSize:12, color:'var(--muted)', fontWeight:600, marginBottom:6, display:'block' }}>NOVEL TITLE <span style={{ fontWeight:400 }}>(or leave blank for AI to create one)</span></label>
                  <input placeholder="e.g. His Secret Obsession" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
                </div>

                <div>
                  <label style={{ fontSize:12, color:'var(--muted)', fontWeight:600, marginBottom:10, display:'block' }}>SELECT GENRE *</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {GENRES.map(g => (
                      <div key={g.id} onClick={() => setForm(f=>({...f,genre:g.id}))} style={{
                        padding:'11px 14px', borderRadius:10, cursor:'pointer',
                        border:`2px solid ${form.genre===g.id ? g.color : 'var(--border)'}`,
                        background: form.genre===g.id ? `color-mix(in srgb, ${g.color} 12%, transparent)` : 'transparent',
                        display:'flex', alignItems:'center', gap:8, transition:'all 0.15s',
                      }}>
                        <span style={{ fontSize:20 }}>{g.emoji}</span>
                        <span style={{ fontSize:13, fontWeight:500 }}>{g.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize:12, color:'var(--muted)', fontWeight:600, marginBottom:6, display:'block' }}>YOUR IDEA <span style={{ fontWeight:400 }}>(optional)</span></label>
                  <textarea
                    placeholder="Describe your story idea, or leave blank and let AI surprise you..."
                    rows={3} value={form.idea}
                    onChange={e=>setForm(f=>({...f,idea:e.target.value}))}
                    style={{ resize:'vertical' }}
                  />
                </div>

                <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
                  <button className="btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
                  <button className="btn-gold" onClick={createProject} disabled={creating}>
                    {creating
                      ? <span style={{ display:'flex', alignItems:'center', gap:8 }}><span className="spinner" style={{ width:16, height:16 }} /> Creating…</span>
                      : 'Continue to Payment →'
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Projects List */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[1,2,3].map(i => (
              <div key={i} className="card" style={{ height:90 }}>
                <div className="skeleton" style={{ width:'40%', height:18, marginBottom:10 }} />
                <div className="skeleton" style={{ width:'60%', height:12 }} />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:'64px 24px' }}>
            <div style={{ fontSize:56, marginBottom:20 }}>📖</div>
            <h3 className="playfair" style={{ fontSize:24, fontWeight:700, marginBottom:10 }}>No novels yet</h3>
            <p style={{ color:'var(--muted)', marginBottom:28, fontSize:15, maxWidth:400, margin:'0 auto 28px' }}>
              Create your first webnovel project and let AI write your story chapter by chapter.
            </p>
            <button className="btn-gold" style={{ padding:'13px 32px', fontSize:15 }} onClick={() => setShowNew(true)}>
              Create Your First Novel →
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {projects.map(proj => {
              const genre = GENRES.find(g => g.id === proj.genre)
              const chaptersDone = proj.chapters?.length || 0
              const progress = proj.maxChapters ? Math.round(chaptersDone / proj.maxChapters * 100) : 0
              return (
                <div
                  key={proj._id}
                  className="card"
                  style={{ display:'flex', alignItems:'center', gap:18, cursor:'pointer', transition:'border-color 0.2s, transform 0.2s' }}
                  onClick={() => router.push(proj.paid ? `/editor/${proj._id}` : `/payment?project=${proj._id}`)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='' }}
                >
                  <div style={{
                    width:58, height:58, flexShrink:0,
                    background: `color-mix(in srgb, ${genre?.color || '#888'} 18%, transparent)`,
                    borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28,
                  }}>{genre?.emoji || '📖'}</div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:16, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {proj.title}
                    </div>
                    <div style={{ color:'var(--muted)', fontSize:13 }}>
                      {genre?.label} · {chaptersDone}/{proj.maxChapters || '—'} chapters
                      {proj.totalWords > 0 && ` · ${(proj.totalWords/1000).toFixed(0)}k words`}
                    </div>
                    {proj.paid && proj.maxChapters > 0 && (
                      <div style={{ marginTop:8 }}>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width:`${progress}%` }} />
                        </div>
                        <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>{progress}% complete</div>
                      </div>
                    )}
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
                    <span className="tag" style={{
                      background: proj.status==='complete' ? 'color-mix(in srgb, #4CAF50 15%, transparent)' :
                        proj.paid ? 'color-mix(in srgb, var(--accent) 15%, transparent)' :
                        'color-mix(in srgb, var(--red) 15%, transparent)',
                      color: proj.status==='complete' ? '#4CAF50' :
                        proj.paid ? 'var(--accent)' : 'var(--red)',
                    }}>
                      {proj.status==='complete' ? '✓ Complete' : proj.paid ? 'Writing' : 'Unpaid'}
                    </span>
                    <button className="btn-danger" style={{ padding:'6px 12px', fontSize:12 }}
                      onClick={e => deleteProject(proj._id, e)}>🗑</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
