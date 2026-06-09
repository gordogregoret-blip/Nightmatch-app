import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import BottomNav from "../components/BottomNav"
import { getActiveVenues, getTonightForVenue, checkIn, getCheckinStatus } from "../lib/supabase"

// Carga inmediata con default BA, actualiza si geo responde en <3s
function useLocation() {
  const [loc, setLoc] = useState({ lat: -34.6037, lng: -58.3816 }) // Buenos Aires default
  useEffect(() => {
    if (!navigator.geolocation) return
    const timer = setTimeout(() => {}, 0) // trigger immediately
    const id = navigator.geolocation.watchPosition(
      pos => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // silently ignore errors, keep default
      { timeout: 3000, maximumAge: 60000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])
  return loc
}

export default function FeedPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [venues, setVenues]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await getActiveVenues(loc.lat, loc.lng, 50000)
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
  }, [loc.lat, loc.lng, user])

  const handleCheckin = async (venue, e) => {
    e.stopPropagation()
    if (!venue.tonight || !user) return
    await checkIn(user.id, venue.id, venue.tonight.id)
    nav("/venue/" + venue.id)
  }

  return (
    <div className="screen">
      <div className="scroll-area">
        {/* HEADER */}
        <div style={{
          padding:"54px 22px 20px",
          background:"radial-gradient(ellipse 100% 60% at 50% 0%, rgba(233,30,140,0.12) 0%, transparent 70%)",
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:3.5, color:"var(--gray)", textTransform:"uppercase", marginBottom:8 }}>
                ESTA NOCHE
              </div>
              <div style={{ fontSize:34, fontWeight:900, letterSpacing:-1.5, lineHeight:1 }}>
                Night<span className="grad-text">Match</span>
              </div>
            </div>
            <button onClick={() => nav("/profile")} style={{
              width:46, height:46, borderRadius:15,
              background:"var(--surface2)",
              border:"1px solid var(--border2)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20,
            }}>👤</button>
          </div>
        </div>

        <div className="neon-line" style={{ margin:"0 22px" }} />

        {loading ? (
          <div className="spinner" />
        ) : venues.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🌙</div>
            <h3>Sin boliches cercanos</h3>
            <p>No hay venues activos en tu zona esta noche. Probá mas tarde.</p>
          </div>
        ) : (
          <div style={{ padding:"20px 16px 32px", display:"flex", flexDirection:"column", gap:12 }}>
            {venues.map(v => (
              <VenueCard key={v.id} venue={v} onCheckin={handleCheckin} nav={nav} />
            ))}
          </div>
        )}
      </div>
      <BottomNav active="feed" />
    </div>
  )
}

function VenueCard({ venue, onCheckin, nav }) {
  const night   = venue.tonight
  const checked = venue.checkin === "going" || venue.checkin === "arrived"

  return (
    <div onClick={() => nav("/venue/" + venue.id)}
      style={{
        background:"var(--bg3)",
        border:"1px solid var(--border)",
        borderRadius:24, overflow:"hidden",
        cursor:"pointer", position:"relative",
      }}>
      <div style={{
        height:2,
        background: night ? "var(--grad)" : "rgba(255,255,255,0.08)",
        boxShadow: night ? "var(--glow-pink)" : "none",
      }} />
      <div style={{ padding:"18px 18px 16px" }}>
        <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
          <div style={{
            width:56, height:56, borderRadius:18, flexShrink:0,
            background:"linear-gradient(135deg, rgba(233,30,140,0.15), rgba(124,58,237,0.15))",
            border:"1px solid rgba(233,30,140,0.2)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:26,
          }}>🏠</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:18, fontWeight:900, letterSpacing:-0.5, marginBottom:4 }}>
              {venue.name}
            </div>
            <div style={{ fontSize:12, color:"var(--grayL)", marginBottom:10 }}>
              📍 {venue.address || "Buenos Aires"}
              {venue.distance_m && " · " + (venue.distance_m/1000).toFixed(1) + " km"}
            </div>
            {night ? (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <span className="badge badge-pink">🎵 {night.music_genre}</span>
                {night.dj_name && <span className="badge badge-gold">🎧 {night.dj_name}</span>}
                {night.checkin_count > 0 && <span className="badge badge-purple">👥 {night.checkin_count}</span>}
              </div>
            ) : (
              <span className="badge badge-red">Sin noche activa</span>
            )}
          </div>
        </div>
        {night?.cover_price > 0 && (
          <div style={{
            marginTop:14, padding:"10px 14px",
            background:"rgba(245,158,11,0.07)",
            border:"1px solid rgba(245,158,11,0.15)",
            borderRadius:14, fontSize:13, color:"var(--goldL)", fontWeight:600,
          }}>
            🎟️ Entrada desde ${night.cover_price}
          </div>
        )}
        <div style={{ display:"flex", gap:8, marginTop:14 }} onClick={e => e.stopPropagation()}>
          {night && (
            <button onClick={e => onCheckin(venue, e)} style={{
              flex:1, padding:"11px",
              background: checked ? "rgba(16,185,129,0.12)" : "var(--grad)",
              border: checked ? "1px solid rgba(16,185,129,0.3)" : "none",
              borderRadius:15, color: checked ? "#6ee7b7" : "#fff",
              fontSize:13, fontWeight:800,
              boxShadow: checked ? "none" : "0 0 16px rgba(233,30,140,0.3)",
            }}>
              {checked ? "✓ Voy esta noche" : "+ Voy esta noche"}
            </button>
          )}
          <button onClick={() => nav("/venue/" + venue.id)} style={{
            padding:"11px 16px",
            background:"var(--surface2)", border:"1px solid var(--border2)",
            borderRadius:15, color:"var(--grayXL)", fontSize:13, fontWeight:600,
          }}>Ver →</button>
        </div>
      </div>
    </div>
  )
}
