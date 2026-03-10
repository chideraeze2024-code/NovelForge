// src/components/TopBar.js
import Link from 'next/link'
import { useAuth } from '../pages/_app'

export default function TopBar() {
  const { user, logout, toggleTheme, theme } = useAuth()

  return (
    <nav className="topbar">
      <Link href={user?.isAdmin ? '/admin' : user ? '/dashboard' : '/'} style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
        <div style={{
          width:36, height:36,
          background:'linear-gradient(135deg, var(--accent), #A8832A)',
          borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
        }}>📖</div>
        <span className="playfair" style={{ fontSize:20, fontWeight:700, color:'var(--accent)' }}>NovelForge AI</span>
      </Link>

      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button className="btn-ghost" onClick={toggleTheme} style={{ padding:'8px 12px', borderRadius:8, fontSize:18 }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {user ? (
          <>
            <span className="hide-mobile" style={{ color:'var(--muted)', fontSize:13 }}>
              {user.name}
            </span>
            {!user.isAdmin && (
              <Link href="/dashboard">
                <button className="btn-ghost" style={{ padding:'8px 16px', fontSize:13 }}>Dashboard</button>
              </Link>
            )}
            <button className="btn-ghost" onClick={logout} style={{ padding:'8px 16px', fontSize:13 }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/auth">
              <button className="btn-ghost" style={{ padding:'9px 20px', fontSize:14 }}>Sign In</button>
            </Link>
            <Link href="/auth?mode=register">
              <button className="btn-gold" style={{ padding:'9px 22px', fontSize:14 }}>Get Started</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
