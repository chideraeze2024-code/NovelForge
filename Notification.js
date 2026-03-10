// src/components/Notification.js
import { useState, useEffect } from 'react'

let notifyFn = null

export function notify(msg, type = 'success') {
  if (notifyFn) notifyFn(msg, type)
}

export default function Notification() {
  const [note, setNote] = useState(null)

  useEffect(() => {
    notifyFn = (msg, type) => {
      setNote({ msg, type, id: Date.now() })
      setTimeout(() => setNote(null), 3500)
    }
  }, [])

  if (!note) return null

  const bg = note.type === 'error' ? '#C0392B' : note.type === 'warn' ? '#E67E22' : '#1A6B5A'

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      background: bg, color: '#fff',
      padding: '14px 22px', borderRadius: 12,
      fontWeight: 500, fontSize: 14,
      boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      maxWidth: 360, animation: 'fadeIn 0.3s ease',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span>{note.type === 'error' ? '⚠️' : '✓'}</span>
      <span>{note.msg}</span>
    </div>
  )
}
