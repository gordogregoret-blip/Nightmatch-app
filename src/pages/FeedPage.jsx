import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'
import { getActiveVenues, getTonightForVenue, checkIn, getCheckinStatus } from '../lib/supabase'

export default function FeedPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [venues, setVenues]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [loc, setLoc]           = useState(null)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()  => setLoc({ lat: -31.42, lng: -64.18 }) // Córdoba default
    )
  }, [])

  useEffect(() => {
    if (!loc) return
    const load = async () => {
      setLoading(true)
      const { data } = await getActiveVenues(loc.lat, loc.lng, 30000)
      if (data) {
        const enriched = await Promise.all(data.map(async v => {
          const { data: night } = await getTonightForVenue(v.id)
          let checkin = null
          if (night && user) checkin = await getCheckinStatus(user.id, night.id)
          return { ...v, tonight: night, checkin }
        }))
        setVenues(enriched)
      }
      setLoading(false)
    }
    load()
  }, [loc, user])

  const handleCheckin = async (venue) => {
    if (!venue.tonight || !user) return
    const { data } = await checkIn(user.id, venue.id, venue.tonight.id)
    if (data) nav(`/venue/${venue.id}`)
  }

  const GENRE_COLORS = {
    'House':       '#a855f7',
    'Techno':      '#06b6d4',
    'Reggaeton':   '#ec4899',
    'Trap':        '#f59e0b',
    'Cumbia':      '#10b981',
    'default':     '#6b7280',
  }

  return (
    <div className="screen">
      <div className="scroll-area">
        {/* Header */}
        <div style={{
          padding: '54px 20px 16px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.15) 0%, transparent 65%)',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:3, color:'var(--gray)', textTransform:'uppercase', marginBottom:6 }}>
                ESTA NOCHE
              </div>
              <div style={{ fontSize:30, fontWeight:900, letterSpacing:-1.2 }}>
                Night<span className="grad-text">Match</span>
              </div>
            </div>
            <button onClick={() => nav('/profile')} style={{
              width:44, height:44, borderRadius:14,
              background:'var(--surface2)', border:'1px solid var(--border)',
              fontSize:20, display:'flex', alignItems:'center', justifyContent:'center',
            }}>👤</button>
          </div>
        </div>

        {/* Venues list */}
        {loading ? (
          <div className="spinner" />
        ) : venues.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🌙</div>
            <h3>Sin boliches cercanos</h3>
            <p>No encontramos venues activos en tu zona esta noche.</p>
          </div>
        ) : (
          <div style={{ padding:'8px 16px 24px', display:'flex', flexDirection:'column', gap:14 }}>
            {venues.map(v => (
              <VenueCard key={v.id} venue={v} onCheckin={handleCheckin} nav={nav} genreColors={GENRE_COLORS} />
            ))}
          </div>
        )}
      </div>
      <BottomNav active="feed" />
    </div>
  )
}

function VenueCard({ venue, onCheckin, nav, genreColors }) {
  const night    = venue.tonight
  const checked  = venue.checkin === 'going' || venue.checkin === 'arrived'
  const color    = genreColors[night?.music_genre] || genreColors.default

  return (
    <div onClick={() => nav(`/venue/${venue.id}`)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 22,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.15s',
      }}>

      {/* Venue color bar */}
      <div style={{ height:4, background: `linear-gradient(90deg, ${color}, transparent)` }} />

      <div style={{ padding:'18px 18px 12px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
          {/* Icon */}
          <div style={{
            width:54, height:54, borderRadius:16,
            background:`linear-gradient(135deg, ${color}22, ${color}44)`,
            border:`1px solid ${color}44`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0,
          }}>🏠</div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:17, fontWeight:800, letterSpacing:-0.4, marginBottom:3 }}>
              {venue.name}
            </div>
            <div style={{ fontSize:12, color:'var(--gray)', marginBottom:8 }}>
              📍 {venue.address || 'Buenos Aires'}
              {venue.distance_m && ` · ${(venue.distance_m/1000).toFixed(1)} km`}
            </div>
            {night ? (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <span className="badge badge-purple">🎵 {night.music_genre}</span>
                {night.dj_name && <span className="badge badge-gold">🎧 {night.dj_name}</span>}
                {night.checkin_count > 0 && <span className="badge badge-pink">👥 {night.checkin_count}</span>}
              </div>
            ) : (
              <span className="badge badge-red">Sin noche activa</span>
            )}
          </div>
        </div>

        {/* Promo highlight */}
        {night?.cover_price > 0 && (
          <div style={{
            marginTop:12, padding:'10px 14px',
            background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)',
            borderRadius:12, fontSize:13, color:'var(--goldL)', fontWeight:600,
          }}>
            🎟️ Entrada desde ${night.cover_price}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display:'flex', gap:8, marginTop:12 }} onClick={e => e.stopPropagation()}>
          {night && (
            <button
              onClick={() => onCheckin(venue)}
              style={{
                flex:1, padding:'10px',
                background: checked ? 'rgba(16,185,129,0.15)' : 'var(--grad)',
                border: checked ? '1px solid rgba(16,185,129,0.4)' : 'none',
                borderRadius:14,
                color: checked ? '#6ee7b7' : '#fff',
                fontSize:13, fontWeight:700,
              }}>
              {checked ? '✓ Voy esta noche' : '+ Voy esta noche'}
            </button>
          )}
          <button
            onClick={() => nav(`/venue/${venue.id}`)}
            style={{
              padding:'10px 14px',
              background:'var(--surface2)', border:'1px solid var(--border)',
              borderRadius:14, color:'var(--grayXL)', fontSize:13, fontWeight:600,
            }}>
            Ver
          </button>
        </div>
      </div>
    </div>
  )
}
