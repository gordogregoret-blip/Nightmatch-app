import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import {
  getVenueById, getTonightForVenue, getVenueEvents,
  getPromosForNight, checkIn, getCheckinStatus, isVenueAdmin
} from "../lib/supabase"

export default function VenuePage() {
  const { id } = useParams()
  const nav    = useNavigate()
  const { user } = useAuth()
  const [venue, setVenue]     = useState(null)
  const [night, setNight]     = useState(null)
  const [events, setEvents]   = useState([])
  const [promos, setPromos]   = useState([])
  const [checkin, setCheckin] = useState(null)
  const [admin, setAdmin]     = useState(false)
  const [tab, setTab]         = useState("info")

  useEffect(() => {
    const load = async () => {
      const [{ data: v }, { data: n }] = await Promise.all([
        getVenueById(id),
        getTonightForVenue(id),
      ])
      setVenue(v)
      setNight(n)
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
          const ia = await isVenueAdmin(id, user.id)
          setAdmin(ia)
        }
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

  return (
    <div className="screen">
      <div className="scroll-area">
        <div style={{
          position:"relative", minHeight:240,
          background:"linear-gradient(160deg, rgba(168,85,247,0.3) 0%, rgba(236,72,153,0.15) 100%)",
          display:"flex", flexDirection:"column", justifyContent:"flex-end",
          padding:"0 20px 24px",
        }}>
          <button className="back-btn" onClick={() => nav("/")}
            style={{ position:"absolute", top:52, left:20, fontSize:18 }}>
            ←
          </button>
          {admin && (
            <button onClick={() => nav("/venue-admin/" + id)}
              style={{
                position:"absolute", top:52, right:20,
                padding:"8px 14px", background:"var(--grad-gold)", borderRadius:12,
                color:"#000", fontSize:12, fontWeight:800, border:"none",
              }}>
              ⚙️ Admin
            </button>
          )}
          <div style={{ fontSize:48, marginBottom:12 }}>🏠</div>
          <div style={{ fontSize:26, fontWeight:900, letterSpacing:"-0.8px" }}>{venue.name}</div>
          <div style={{ fontSize:13, color:"var(--grayL)", marginTop:4 }}>{venue.address}</div>
          {night && (
            <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
              <span className="badge badge-purple">🎵 {night.music_genre}</span>
              {night.dj_name && <span className="badge badge-gold">🎧 {night.dj_name}</span>}
            </div>
          )}
        </div>

        <div style={{ display:"flex", margin:"16px 16px", gap:6 }}>
          {["info","eventos","promos"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1, padding:"9px 4px",
              background: tab===t ? "var(--grad)" : "var(--surface)",
              border: tab===t ? "none" : "1px solid var(--border)",
              borderRadius:12, color: tab===t ? "#fff" : "var(--gray)",
              fontSize:12, fontWeight:700, textTransform:"capitalize",
            }}>{t}</button>
          ))}
        </div>

        <div style={{ padding:"0 16px 120px" }}>
          {tab === "info" && (
            <div>
              {venue.description && (
                <div style={{ fontSize:14, color:"var(--grayL)", lineHeight:1.7, marginBottom:20 }}>
                  {venue.description}
                </div>
              )}
              <InfoRow label="Capacidad" value={venue.capacity ? venue.capacity + " personas" : "N/D"} />
              <InfoRow label="Horario" value={(night?.open_time || "23:00") + " - " + (night?.close_time || "06:00")} />
              <InfoRow label="Entrada" value={night?.cover_price > 0 ? "$" + night.cover_price : "Sin cargo"} />
            </div>
          )}
          {tab === "eventos" && (
            events.length === 0
              ? <div className="empty-state"><div className="icon">🎪</div><h3>Sin eventos</h3><p>No hay eventos para esta noche.</p></div>
              : events.map(ev => <EventCard key={ev.id} event={ev} />)
          )}
          {tab === "promos" && (
            promos.length === 0
              ? <div className="empty-state"><div className="icon">🎁</div><h3>Sin promos</h3><p>No hay promociones esta noche.</p></div>
              : promos.map(pr => <PromoCard key={pr.id} promo={pr} />)
          )}
        </div>
      </div>

      {night && (
        <div style={{ padding:"12px 16px 32px", background:"rgba(6,6,12,0.96)", borderTop:"1px solid var(--border)", display:"flex", gap:10 }}>
          <button onClick={handleCheckin} style={{
            flex:1, padding:"14px",
            background: checked ? "rgba(16,185,129,0.15)" : "var(--grad)",
            border: checked ? "1px solid rgba(16,185,129,0.35)" : "none",
            borderRadius:16, color: checked ? "#6ee7b7" : "#fff",
            fontSize:14, fontWeight:700,
          }}>
            {checked ? "✓ Voy esta noche" : "+ Voy esta noche"}
          </button>
          {checked && (
            <button onClick={() => nav("/swipe/" + id + "/" + night.id)} style={{
              flex:1, padding:"14px",
              background:"var(--grad-gold)", border:"none",
              borderRadius:16, color:"#000", fontSize:14, fontWeight:800,
            }}>💘 Swipe</button>
          )}
        </div>
      )}
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

function EventCard({ event }) {
  return (
    <div style={{
      background:"var(--surface)", border:"1px solid var(--border)",
      borderRadius:16, padding:"14px 16px", marginBottom:10,
    }}>
      <div style={{ fontSize:14, fontWeight:800, marginBottom:2 }}>{event.name}</div>
      {event.start_time && (
        <div style={{ fontSize:12, color:"var(--gray)" }}>
          {event.start_time}{event.end_time ? " - " + event.end_time : ""}
        </div>
      )}
      {event.description && (
        <div style={{ fontSize:12, color:"var(--grayL)", marginTop:4 }}>{event.description}</div>
      )}
    </div>
  )
}

function PromoCard({ promo }) {
  return (
    <div style={{
      background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)",
      borderRadius:16, padding:"14px 16px", marginBottom:10,
    }}>
      <div style={{ fontSize:15, fontWeight:800, color:"var(--goldL)", marginBottom:4 }}>{promo.title}</div>
      {promo.description && (
        <div style={{ fontSize:13, color:"var(--grayL)", lineHeight:1.6 }}>{promo.description}</div>
      )}
    </div>
  )
}
