import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, sendLike, subscribeToMatches } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'

const COLORS = ['#6C63FF','#FF4D6D','#00C9A7','#F7B731','#A89EFF','#FF6B6B','#4ECDC4']
const colorFor = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length]

export default function MatchingPage() {
  const { venueId, nightId } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const [users, setUsers] = useState([])
  const [liked, setLiked] = useState(new Set())
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [venueName, setVenueName] = useState('')

  useEffect(() => {
    loadUsers()
    loadVenueName()
    const sub = subscribeToMatches(user?.id, (payload) => {
      if (payload.new) setMatch(payload.new)
    })
    return () => sub.unsubscribe?.()
  }, [nightId])

  const loadVenueName = async () => {
    const { data } = await supabase.from('venues').select('name').eq('id', venueId).single()
    if (data) setVenueName(data.name)
  }

  const loadUsers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('checkins')
      .select('*, profiles(id, name, age, avatar_url, music_prefs)')
      .eq('night_id', nightId)
      .in('status', ['going','arrived'])
      .neq('user_id', user?.id)
    if (data) setUsers(data)
    setLoading(false)
  }

  const handleLike = async (targetUserId) => {
    if (liked.has(targetUserId)) return
    setLiked(prev => new Set([...prev, targetUserId]))
    await sendLike(user.id, targetUserId, venueId, nightId)
    // Check if it created a match
    const { data } = await supabase
      .from('matches')
      .select('*')
      .or(`and(user_a_id.eq.${user.id},user_b_id.eq.${targetUserId}),and(user_a_id.eq.${targetUserId},user_b_id.eq.${user.id})`)
      .eq('night_id', nightId)
      .single()
    if (data) {
      const matchedUser = users.find(u => u.user_id === targetUserId)
      setMatch({ ...data, matchedName: matchedUser?.profiles?.name })
    }
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button onClick={() => nav(-1)} style={{ background: 'var(--cardB)', border: 'none', color: 'var(--grayL)', borderRadius: '50%', width: 32, height: 32, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <div>
          <h1 style={{ fontSize: 17 }}>Van a {venueName}</h1>
          <div style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 400 }}>{users.length} personas esta noche</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {loading && <div className="spinner" />}

        {!loading && users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray)' }}>
            <div style={{ fontSize: 36 }}>👋</div>
            <div style={{ fontSize: 15, marginTop: 12 }}>Sos el primero en confirmar</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Avisale a tus amigos y volvé más tarde</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {users.map(c => {
            const p = c.profiles
            const isLiked = liked.has(c.user_id)
            return (
              <div key={c.id} className="card" style={{ overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  height: 120, background: `linear-gradient(135deg, ${colorFor(p?.name)}33, ${colorFor(p?.name)}11)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 42, fontWeight: 800, color: colorFor(p?.name)
                }}>{p?.name?.slice(0,1).toUpperCase()}</div>
                <div style={{ padding: '10px 10px 12px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{p?.name?.split(' ')[0]}, {p?.age}</div>
                  <div style={{ fontSize: 11, color: 'var(--purpleL)', marginTop: 3 }}>
                    {p?.music_prefs?.slice(0,2).join(' · ')}
                  </div>
                  <button onClick={() => handleLike(c.user_id)}
                    style={{
                      marginTop: 8, width: '100%', padding: '7px',
                      borderRadius: 10, border: `1px solid ${isLiked ? 'var(--red)' : 'var(--border)'}`,
                      background: isLiked ? 'rgba(255,77,109,.15)' : 'transparent',
                      color: isLiked ? 'var(--red)' : 'var(--gray)',
                      fontSize: 13, transition: 'all .15s'
                    }}>{isLiked ? '♥ Le diste like' : '♡ Like'}</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Match toast */}
      {match && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)', maxWidth: 390,
          background: 'var(--card)', border: '1px solid var(--purple)',
          borderRadius: 18, padding: '18px', textAlign: 'center', zIndex: 200
        }}>
          <div style={{ fontSize: 32 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>
            ¡Match con {match.matchedName}!
          </div>
          <div style={{ fontSize: 13, color: 'var(--grayL)', marginTop: 4 }}>
            También va a {venueName} esta noche
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={() => setMatch(null)} className="btn-secondary" style={{ width: 'auto', flex: 1, padding: '10px' }}>Seguir viendo</button>
            <button onClick={() => nav(`/chat/${match.id}`)} className="btn-primary" style={{ flex: 1, padding: '10px' }}>Abrir chat →</button>
          </div>
        </div>
      )}

      <BottomNav active="match" />
    </div>
  )
}
