import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyMatches } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'

const COLORS = ['#6C63FF','#FF4D6D','#00C9A7','#F7B731','#A89EFF']
const colorFor = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length]

export default function ChatsPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getMyMatches(user.id).then(({ data }) => {
      if (data) setMatches(data)
      setLoading(false)
    })
  }, [user])

  return (
    <div className="screen">
      <div className="topbar"><h1>Chats</h1></div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        {loading && <div className="spinner" />}
        {!loading && matches.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray)' }}>
            <div style={{ fontSize: 36 }}>💬</div>
            <div style={{ fontSize: 15, marginTop: 12 }}>No tenés matches todavía</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Confirmá que vas a un venue y hacé match</div>
            <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => nav('/')}>
              Ver venues de esta noche
            </button>
          </div>
        )}
        {matches.map(m => {
          const other = m.user_a?.id === user.id ? m.user_b : m.user_a
          const initials = other?.name?.slice(0,1).toUpperCase() || '?'
          const isExpired = new Date(m.expires_at) < new Date()
          return (
            <div key={m.id} onClick={() => !isExpired && nav(`/chat/${m.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 0', borderBottom: '1px solid var(--border)',
                cursor: isExpired ? 'default' : 'pointer',
                opacity: isExpired ? 0.5 : 1
              }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: colorFor(other?.name),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 800, flexShrink: 0
              }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{other?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                  Match en {m.venues?.name}
                </div>
              </div>
              <div style={{ fontSize: 11, color: isExpired ? 'var(--red)' : 'var(--teal)', textAlign: 'right' }}>
                {isExpired ? 'Expirado' : 'Activo'}
              </div>
            </div>
          )
        })}
      </div>
      <BottomNav active="chats" />
    </div>
  )
}
