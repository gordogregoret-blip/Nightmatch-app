import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActiveVenues } from '../lib/supabase'
import BottomNav from '../components/BottomNav'

export default function FeedPage() {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Todos')
  const nav = useNavigate()

  const FILTERS = ['Todos','Electrónica','House','Reggaeton','Con promo']

  useEffect(() => {
    loadVenues()
  }, [])

  const loadVenues = async () => {
    setLoading(true)
    // Default to Reconquista, SF coords if geolocation not available
    const lat = -29.1472, lng = -59.6437
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => fetchVenues(pos.coords.latitude, pos.coords.longitude),
        ()  => fetchVenues(lat, lng)
      )
    } else {
      fetchVenues(lat, lng)
    }
  }

  const fetchVenues = async (lat, lng) => {
    const { data, error } = await getActiveVenues(lat, lng, 20000)
    if (!error && data) setVenues(data)
    setLoading(false)
  }

  const filtered = venues.filter(v => {
    if (filter === 'Todos') return true
    if (filter === 'Con promo') return !!v.promo_text
    return v.music_types?.some(m => m.toLowerCase().includes(filter.toLowerCase()))
  })

  const heatLabel = (n) => {
    if (n >= 60) return { text: `🔥 ${n} van`, bg: 'rgba(255,77,109,.85)' }
    if (n >= 20) return { text: `💜 ${n} van`, bg: 'rgba(108,99,255,.85)' }
    return { text: `${n} van`, bg: 'rgba(139,139,168,.7)' }
  }

  const distLabel = (m) => {
    if (!m) return ''
    return m < 1000 ? `${Math.round(m)}m` : `${(m/1000).toFixed(1)}km`
  }

  return (
    <div className="screen">
      <div className="topbar">
        <h1>Esta noche</h1>
        <div style={{ fontSize: 13, color: 'var(--gray)' }}>Reconquista, SF</div>
      </div>

      {/* Search */}
      <div style={{
        margin: '0 16px 10px',
        background: 'var(--cardB)', borderRadius: 12,
        padding: '10px 14px', display: 'flex', gap: 8,
        border: '1px solid var(--border)'
      }}>
        <span style={{ color: 'var(--gray)', fontSize: 16 }}>🔍</span>
        <input placeholder="Buscar venues..."
          style={{ background: 'none', border: 'none', color: 'var(--white)', fontSize: 14, flex: 1, outline: 'none' }} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto' }}>
        {FILTERS.map(f => (
          <div key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, whiteSpace: 'nowrap',
            border: `1px solid ${filter === f ? 'var(--purple)' : 'var(--border)'}`,
            background: filter === f ? 'rgba(108,99,255,.2)' : 'transparent',
            color: filter === f ? 'var(--purpleL)' : 'var(--grayL)',
            cursor: 'pointer'
          }}>{f}</div>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '0 16px', overflowY: 'auto' }}>
        {loading && <div className="spinner" />}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray)' }}>
            <div style={{ fontSize: 36 }}>🌙</div>
            <div style={{ fontSize: 15, marginTop: 12 }}>No hay venues activos esta noche</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Los venues aparecen acá cuando activan su noche</div>
          </div>
        )}

        {filtered.map(venue => {
          const heat = heatLabel(venue.heat || 0)
          return (
            <div key={venue.id} className="card"
              style={{ marginBottom: 14, overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => nav(`/venue/${venue.id}`)}>

              {/* Image area */}
              <div style={{
                height: 150,
                background: 'linear-gradient(135deg,#1a1035,#0f2040)',
                position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 12
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(13,13,26,.9) 30%, transparent)'
                }} />
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  background: heat.bg, borderRadius: 20,
                  padding: '4px 10px', fontSize: 11, fontWeight: 600
                }}>{heat.text}</div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{venue.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--grayL)', marginTop: 2 }}>
                    {distLabel(venue.distance_m)}
                    {venue.music_types?.length ? ` · ${venue.music_types.slice(0,2).join(' & ')}` : ''}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '12px 14px' }}>
                {venue.dj_name && (
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 6 }}>
                    DJ {venue.dj_name} esta noche
                  </div>
                )}
                {venue.promo_text && (
                  <div style={{
                    fontSize: 12, color: 'var(--teal)', marginBottom: 10,
                    background: 'rgba(0,201,167,.08)', padding: '5px 10px', borderRadius: 8, display: 'inline-block'
                  }}>🎟 {venue.promo_text}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 12, color: 'var(--gray)' }}>
                    {venue.heat > 0 ? `${venue.heat} personas van esta noche` : 'Sé el primero en confirmar'}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); nav(`/venue/${venue.id}`) }}
                    style={{
                      padding: '7px 16px', background: 'var(--purple)',
                      border: 'none', borderRadius: 20,
                      color: '#fff', fontSize: 12, fontWeight: 600
                    }}>Ver venue</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <BottomNav active="feed" />
    </div>
  )
}
