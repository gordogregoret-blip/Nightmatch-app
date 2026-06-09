import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import {
  getVenueById, getTonightForVenue, getVenueEvents,
  getPromosForNight, getFlyers, checkIn, getCheckinStatus, isVenueAdmin
} from "../lib/supabase"

export default function VenuePage() {
  const { id } = useParams()
  const nav    = useNavigate()
  const { user, profile } = useAuth()
  const [venue, setVenue]     = useState(null)
  const [night, setNight]     = useState(null)
  const [events, setEvents]   = useState([])
  const [promos, setPromos]   = useState([])
  const [flyers, setFlyers]   = useState([])
  const [checkin, setCheckin] = useState(null)
  const [admin, setAdmin]     = useState(false)
  const [tab, setTab]         = useState("info")

  useEffect(() => {
    const load = async () => {
      const [{ data: v }, { data: n }, { data: fl }] = await Promise.all([
        getVenueById(id),
        getTonightForVenue(id),
        getFlyers(id),
      ])
      setVenue(v)
      setNight(n)
      setFlyers(fl || [])
      if (n) {
        const [{ data: ev }, { data: pr }] = await Promise.all([
          getVenueEvents(id, n.id),
          getPromosForNight(n.id),
        ])
        setEvents(ev || [])
        setPromos(pr || [])
        if (user) {
          const status = await getCheckinStatus(user.id, n.id)
          setCheckin(status)
        }
      }
      if (user) {
        const isSuperAdmin = profile?.role === 'superadmin'
        const ia = isSuperAdmin || await isVenueAdmin(id, user.id)
        setAdmin(ia)
      }
    }
    load()
  }, [id, user])

  const handleCheckin = async () => {
    if (!night || !user) return
    const { data } = await checkIn(user.id, id, night.id)
    if (data) setCheckin("going")
  }

  if (!venue) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"}}>
      <div className="spinner"/>
    </div>
  )

  const checked = checkin === "going" || checkin === "arrived"
  const TABS = ["info", "flyers", "eventos", "promos"]

  return (
    <div className="screen">
      <div className="scroll-area">
        {/* HERO */}
        <div style={{
          position:"relative", minHeight:220,
          background:"linear-gradient(160deg, rgba(233,30,140,0.25) 0%, rgba(124,58,237,0.15) 100%)",
          display:"flex", flexDirection:"column", justifyContent:"flex-end",
          padding:"0 20px 24px",
        }}>
          <button className="back-btn" onClick={() => nav("/")}
            style={{ position:"absolute", top:52, left:20, fontSize:18 }}>←</button>
          {admin && (
            <button onClick={() => nav("/venue-admin/" + id)}
              style={{
                position:"absolute", top:52, right:20,
                padding:"8px 14px", background:"var(--grad-gold)", borderRadius:12,
                color:"#000", fontSize:12, fontWeight:800, border:"none",
              }}>⚙️ Admin</button>
          )}
          <div style={{ fontSize:52, marginBottom:12 }}>🏠</div>
          <div style={{ fontSize:26, fontWeight:900, letterSpacing:"-0.8px" }}>{venue.name}</div>
          <div style={{ fontSize:13, color:"var(--grayL)", marginTop:4 }}>📍 {venue.address}</div>
          {night && (
            <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
              <span className="badge badge-pink">🎵 {night.music_genre}</span>
              {night.dj_name && <span className="badge badge-gold">🎧 {night.dj_name}</span>}
              {night.cover_price > 0 && <span className="badge badge-purple">🎟️ ${night.cover_price}</span>}
            </div>
          )}
          {!night && <span className="badge badge-red" style={{ marginTop:10, width:"fit-content" }}>Sin noche activa hoy</span>}
        </div>

        {/* TABS */}
        <div style={{ display:"flex", margin:"16px 16px 0", gap:6 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1, padding:"9px 2px",
              background: tab===t ? "var(--grad)" : "var(--surface)",
              border: tab===t ? "none" : "1px solid var(--border)",
              borderRadius:12, color: tab===t ? "#fff" : "var(--gray)",
              fontSize:11, fontWeight:700, textTransform:"capitalize",
              boxShadow: tab===t ? "var(--glow-pink)" : "none",
            }}>{t}</button>
          ))}
        </div>

        <div style={{ padding:"16px 16px 120px" }}>

          {/* INFO */}
          {tab === "info" && (
            <div>
              {venue.description && (
                <div style={{ fontSize:14, color:"var(--grayL)", lineHeight:1.7, marginBottom:20 }}>
                  {venue.description}
                </div>
              )}
              <InfoRow label="Horario" value={night ? (night.open_time || "23:00") + " – " + (night.close_time || "06:00") : "–"} />
              <InfoRow label="Entrada" value={night?.cover_price > 0 ? "$" + night.cover_price : "Sin cargo"} />
              <InfoRow label="DJ / Artista" value={night?.dj_name || "–"} />
              <InfoRow label="Música" value={night?.music_genre || "–"} />
            </div>
          )}

          {/* FLYERS */}
          {tab === "flyers" && (
            flyers.length === 0
              ? <div className="empty-state">
                  <div className="icon">🖼️</div>
                  <h3>Sin flyers</h3>
                  <p>El boliche aún no subió flyers para esta semana.</p>
                </div>
              : <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {flyers.map(f => <FlyerCard key={f.id} flyer={f} />)}
                </div>
          )}

          {/* EVENTOS */}
          {tab === "eventos" && (
            events.length === 0
              ? <div className="empty-state">
                  <div className="icon">🎪</div>
                  <h3>Sin eventos</h3>
                  <p>No hay eventos programados para esta noche.</p>
                </div>
              : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {events.map(ev => <EventCard key={ev.id} event={ev} />)}
                </div>
          )}

          {/* PROMOS */}
          {tab === "promos" && (
            promos.length === 0
              ? <div className="empty-state">
                  <div className="icon">🎁</div>
                  <h3>Sin promos</h3>
                  <p>No hay promociones activas esta noche.</p>
                </div>
              : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {promos.map(pr => <PromoCard key={pr.id} promo={pr} />)}
                </div>
          )}

        </div>
      </div>

      {/* BOTTOM ACTION */}
      <div style={{ padding:"12px 16px 32px", background:"rgba(0,0,0,0.97)", borderTop:"1px solid rgba(233,30,140,0.15)", display:"flex", gap:10, flexShrink:0 }}>
        {night ? (
          <>
            <button onClick={handleCheckin} style={{
              flex:1, padding:"15px",
              background: checked ? "rgba(16,185,129,0.12)" : "var(--grad)",
              border: checked ? "1px solid rgba(16,185,129,0.35)" : "none",
              borderRadius:16, color: checked ? "#6ee7b7" : "#fff",
              fontSize:14, fontWeight:800,
              boxShadow: checked ? "none" : "var(--glow-pink)",
            }}>
              {checked ? "✓ Voy esta noche" : "+ Voy esta noche"}
            </button>
            {checked && (
              <button onClick={() => nav("/swipe/" + id + "/" + night.id)} style={{
                flex:1, padding:"15px",
                background:"var(--grad)", border:"none",
                borderRadius:16, color:"#fff", fontSize:14, fontWeight:800,
                boxShadow:"var(--glow-pink)",
              }}>💘 Ver gente</button>
            )}
          </>
        ) : (
          <div style={{ flex:1, textAlign:"center", fontSize:13, color:"var(--gray)", padding:"14px" }}>
            No hay noche activa hoy
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"14px 0", borderBottom:"1px solid var(--border)",
    }}>
      <span style={{ fontSize:13, color:"var(--gray)" }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:700 }}>{value}</span>
    </div>
  )
}

function FlyerCard({ flyer }) {
  return (
    <div style={{
      background:"var(--surface)", border:"1px solid var(--border)",
      borderRadius:20, overflow:"hidden",
    }}>
      {flyer.image_url && (
        <img src={flyer.image_url} alt={flyer.title}
          style={{ width:"100%", aspectRatio:"16/9", objectFit:"cover", display:"block" }} />
      )}
      {!flyer.image_url && (
        <div style={{ width:"100%", aspectRatio:"16/9", background:"var(--bg3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:48 }}>
          🖼️
        </div>
      )}
      <div style={{ padding:"14px 16px" }}>
        {flyer.title && <div style={{ fontSize:15, fontWeight:800, marginBottom:4 }}>{flyer.title}</div>}
        {flyer.description && <div style={{ fontSize:13, color:"var(--grayL)", lineHeight:1.6 }}>{flyer.description}</div>}
        {flyer.valid_to && (
          <div style={{ fontSize:11, color:"var(--gray)", marginTop:8, fontWeight:600, letterSpacing:0.5 }}>
            Válido hasta {flyer.valid_to}
          </div>
        )}
      </div>
    </div>
  )
}

function EventCard({ event }) {
  return (
    <div style={{
      background:"var(--surface)", border:"1px solid var(--border)",
      borderRadius:16, padding:"14px 16px",
      display:"flex", gap:14, alignItems:"center",
    }}>
      <div style={{ fontSize:28 }}>{event.emoji || "🎉"}</div>
      <div>
        <div style={{ fontSize:14, fontWeight:800 }}>{event.name}</div>
        {event.start_time && (
          <div style={{ fontSize:12, color:"var(--gray)", marginTop:2 }}>
            🕐 {event.start_time}{event.end_time ? " – " + event.end_time : ""}
          </div>
        )}
        {event.description && (
          <div style={{ fontSize:12, color:"var(--grayL)", marginTop:4 }}>{event.description}</div>
        )}
      </div>
    </div>
  )
}

function PromoCard({ promo }) {
  return (
    <div style={{
      background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.2)",
      borderRadius:16, padding:"16px",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <div style={{ fontSize:20 }}>🎁</div>
        <div style={{ fontSize:15, fontWeight:800, color:"var(--goldL)" }}>{promo.title}</div>
      </div>
      {promo.discount_pct && (
        <div style={{
          display:"inline-block", padding:"3px 10px",
          background:"rgba(245,158,11,0.15)", borderRadius:100,
          fontSize:12, fontWeight:800, color:"var(--goldL)", marginBottom:6,
        }}>{promo.discount_pct}% OFF</div>
      )}
      {promo.description && (
        <div style={{ fontSize:13, color:"var(--grayL)", lineHeight:1.6 }}>{promo.description}</div>
      )}
    </div>
  )
}
