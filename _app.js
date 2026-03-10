// src/pages/_app.js
import '../styles/globals.css'
import { useState, useEffect, createContext, useContext } from 'react'
import Head from 'next/head'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export default function App({ Component, pageProps }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [theme, setTheme] = useState('dark')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('nf_token')
    const savedUser = localStorage.getItem('nf_user')
    const savedTheme = localStorage.getItem('nf_theme') || 'dark'
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
    setLoading(false)
  }, [])

  const login = (userData, tokenData) => {
    setUser(userData)
    setToken(tokenData)
    localStorage.setItem('nf_token', tokenData)
    localStorage.setItem('nf_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('nf_token')
    localStorage.removeItem('nf_user')
    window.location.href = '/'
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('nf_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const apiFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })
    return res
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0D0B12' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>📖</div>
        <div className="spinner" style={{ margin:'0 auto' }} />
      </div>
    </div>
  )

  return (
    <AuthContext.Provider value={{ user, token, login, logout, apiFetch, theme, toggleTheme }}>
      <Head>
        <title>NovelForge AI — Generate Bestselling Webnovels</title>
        <meta name="description" content="AI-powered webnovel generation platform. Create GoodNovel-quality stories in minutes." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </AuthContext.Provider>
  )
}
