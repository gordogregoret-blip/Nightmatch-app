import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, checkIn, getUsersGoingTonight } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'

export default function VenuePage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const [venue, setVenue] = useState(null)
  const [night, setNight] = useState(null)
  const [promo, setPromo] = useState(null)
  const [goingUsers, setGoingUsers] = useState([])
  const [isGoing, setIsGoing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadVenue() }, [id])

  const loadVenue = async () => {
    const { data } = await supabase
      .from('venues')
      .select('*')
      .eq('id', id)
      .single()
    if (data) setVenue(data)

    const today = new Date().toISOString().split('T')[0]
    const { data: nightData } = await supabase
      .from('nights')
      .select('*')
      .eq('venue_id', id)
      .eq('date', today)
      .eq('is_active', true)
      .single()

    if (nightData) {
      setNight(nightData)
      const { data: promoData } = await supabase
        .from('promotions')
        .select('*')
        .eq('night_id', nightData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (promoData) setPromo(promoData)

      const { data: going } = await getUsersGoingTonight(nightData.id)
      if (going) {
        setGoingUsers(going)
        setIsGoing(going.some(c => c.user_id === user?.id))
      }
    }
    setLoading(false)
  }

  const handleGoingTonight = async () => {
    if (!night) return
    const { error } = await checkIn(user.id, id, night.id)
    if (!error) {
      setIsGoing(true)
      nav(`/matching/${id}/${night.id}`)
    }
  }

  if (loading) return <div style={{ padding: 40 }}><div className="spinner" /></div>
  if (!venue) return <div style={{ padding: 24, color: 'var(--gray)' }}>Venue no encontrado</div>

  return (
    <div className="screen">
      {/* Hero */}
      <div style={{
        height: 220, background: 'linear-gradient(135deg,#1a1035,#0f2040)',
        position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 16
      }}>
        <button onClick={() => nav(-1)} style={{
          position: 'absolute', top: 16, left: 16, width: 36, height: 36,
          borderRadius: '50%', background: 'rgba(0,0,0,.5)', border: 'none',
          color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>←</button>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(13,13,26,.95) 40%, rgba(13,13,26,.1))'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {night && <div style={{ fontSize: 12, color: 'var(--teal)', marginBottom: 4 }}>
            Noche activa · {night.opens_at?.slice(0,5)}hs
          </div>}
          <div style={{ fontSize: 26, fontWeight: 800 }}>{venue.name}</div>
          <div style={{ fontSize: 13, color: 'var(--grayL)', marginTop: 4 }}>
            {venue.address}{night?.dj_name ? ` · DJ ${night.dj_name}` : ''}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Promo banner */}
        {promo && (
          <div style={{
            margin: '14px 16px',
            background: 'rgba(0,201,167,.1)', border: '1px solid rgba(0,201,167,.25)',
            borderRadius: 14, padding: '12px 14px'
          }}>
            <div style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 700, letterSpacing: 1 }}>
              PROMO ACTIVA ESTA NOCHE
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{promo.text}</div>
            {promo.condition && <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{promo.condition}</div>}
          </div>
        )}

        {/* Tags */}
        <div style={{ padding: '0 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {venue.music_types?.map(m => (
            <div key={m} style={{
              padding: '6px 12px', background: 'var(--cardB)',
              borderRadius: 20, fontSize: 12, color: 'var(--grayL)',
              border: '1px solid var(--border)'
            }}>🎵 {m}</div>
          ))}
          {venue.dress_code && (
            <div style={{ padding: '6px 12px', background: 'var(--cardB)', borderRadius: 20, fontSize: 12, color: 'var(--grayL)', border: '1px solid var(--border)' }}>
              👔 {venue.dress_code}
            </div>
          )}
          <div style={{ padding: '6px 12px', background: 'var(--cardB)', borderRadius: 20, fontSize: 12, color: 'var(--grayL)', border: '1px solid var(--border)' }}>
            🔞 +{venue.min_age}
          </div>
        </div>

        {/* Who's going */}
        {goingUsers.length > 0 && (
          <>
            <div style={{ padding: '16px 16px 8px', fontSize: 13, fontWeight: 700, color: 'var(--gray)', letterSpacing: .5 }}>
              QUIÉN MÁS VA ESTA NOCHE
            </div>
            <div style={{ padding: '0 16px', display: 'flex', gap: 12, overflowX: 'auto' }}>
              {goingUsers.slice(0, 8).map(c => {
                const p = c.profiles
                const initials = p?.name?.slice(0,1).toUpperCase() || '?'
                const colors = ['#6C63FF','#FF4D6D','#00C9A7','#F7B731','#A89EFF']
                const color = colors[p?.name?.charCodeAt(0) % colors.length] || colors[0]
                return (
                  <div key={c.id} style={{ flexShrink: 0, textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => night && nav(`/matching/${id}/${night.id}`)}>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: color, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 20, fontWeight: 800,
                      border: '2px solid var(--card)'
                    }}>{initials}</div>
                    <div style={{ fontSize: 11, color: 'var(--grayL)', marginTop: 4 }}>{p?.name?.split(' ')[0]}</div>
                    <div style={{ fontSize: 10, color: 'var(--gray)' }}>{p?.age}</div>
                  </div>
                )
              })}
              {goingUsers.length > 8 && (
                <div style={{ flexShrink: 0, textAlign: 'center' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'var(--cardB)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 14, fontWeight: 700,
                    border: '2px solid var(--border)'
                  }}>+{goingUsers.length - 8}</div>
                </div>
              )}
            </div>
          </>
        )}

        {!night && (
          <div style={{ margin: '20px 16px', padding: '14px', background: 'var(--cardB)', borderRadius: 12, textAlign: 'center', color: 'var(--gray)', fontSize: 13 }}>
            Este venue no tiene noche activa hoy
          </div>
        )}
      </div>

      {/* CTA */}
      {night && (
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--dark)' }}>
          {isGoing ? (
            <button className="btn-primary" style={{ background: 'var(--teal)' }}
              onClick={() => nav(`/matching/${id}/${night.id}`)}>
              ✓ Vas esta noche — Ver quién más va →
            </button>
          ) : (
            <button className="btn-primary" onClick={handleGoingTonight}>
              Voy esta noche → Ver quién más va
            </button>
          )}
        </div>
      )}

      <BottomNav active="feed" />
    </div>
  )
}
