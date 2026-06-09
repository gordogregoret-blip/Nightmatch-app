import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import {
  getVenueById, getTonightForVenue, createNight, updateNight,
  getVenueEvents, createEvent, deleteEvent,
  getVenueAds, createAd, deleteAd,
  getPromosForNight, createPromo,
  getFlyers, createFlyer, deleteFlyer,
  isVenueAdmin
} from "../lib/supabase"

const MUSIC_GENRES = ["House","Techno","Reggaeton","Trap","Cumbia","Pop","R&B","Electronica","Salsa","Merengue"]

export default function VenueAdminPage() {
  const { venueId } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const [venue, setVenue]   = useState(null)
  const [night, setNight]   = useState(null)
  const [events, setEvents] = useState([])
  const [ads, setAds]       = useState([])
  const [promos, setPromos] = useState([])
  const [flyers, setFlyers] = useState([])
  const [tab, setTab]       = useState("noche")
  const [authorized, setAuthorized] = useState(false)
  const [nightForm, setNightForm] = useState({ music_genre:"House", dj_name:"", cover_price:"", open_time:"22:00", close_time:"06:00" })
  const [eventForm, setEventForm] = useState({ name:"", emoji:"🎉", start_time:"", description:"" })
  const [adForm, setAdForm]       = useState({ title:"", description:"" })
  const [promoForm, setPromoForm] = useState({ title:"", description:"", discount_pct:"" })
  const [flyerForm, setFlyerForm] = useState({ title:"", description:"", image_url:"", valid_to:"" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (!user) return
      const ok = await isVenueAdmin(venueId, user.id)
      if (!ok) { nav("/"); return }
      setAuthorized(true)
      const [{ data: v }, { data: n }] = await Promise.all([
        getVenueById(venueId),
        getTonightForVenue(venueId),
      ])
      setVenue(v)
      if (n) {
        setNight(n)
        setNightForm({
          music_genre: n.music_genre || "House",
          dj_name: n.dj_name || "",
          cover_price: n.cover_price || "",
          open_time: n.open_time || "22:00",
          close_time: n.close_time || "06:00",
        })
        const [{ data: ev }, { data: pr }] = await Promise.all([
          getVenueEvents(venueId, n.id),
          getPromosForNight(n.id),
        ])
        setEvents(ev || [])
        setPromos(pr || [])
      }
      const { data: adsData } = await getVenueAds(venueId)
      setAds(adsData || [])
      const { data: flyersData } = await getFlyers(venueId)
      setFlyers(flyersData || [])
    }
    init()
  }, [venueId, user])

  const saveNight = async () => {
    setSaving(true)
    const today = new Date().toISOString().split("T")[0]
    if (night) {
      await updateNight(night.id, { ...nightForm, cover_price: nightForm.cover_price ? parseFloat(nightForm.cover_price) : null })
    } else {
      const { data } = await createNight({ venue_id: venueId, date: today, is_active: true, ...nightForm })
      setNight(data)
    }
    setSaving(false)
  }

  const addEvent = async () => {
    if (!eventForm.name.trim() || !night) return
    await createEvent({ venue_id: venueId, night_id: night.id, ...eventForm })
    const { data } = await getVenueEvents(venueId, night.id)
    setEvents(data || [])
    setEventForm({ name:"", emoji:"🎉", start_time:"", description:"" })
  }

  const removeEvent = async (id) => {
    await deleteEvent(id)
    setEvents(ev => ev.filter(e => e.id !== id))
  }

  const addAd = async () => {
    if (!adForm.title.trim()) return
    await createAd({ venue_id: venueId, ...adForm })
    const { data } = await getVenueAds(venueId)
    setAds(data || [])
    setAdForm({ title:"", description:"" })
  }

  const removeAd = async (id) => {
    await deleteAd(id)
    setAds(a => a.filter(x => x.id !== id))
  }

  const addFlyer = async () => {
    if (!flyerForm.title.trim()) return
    await createFlyer({ venue_id: venueId, ...flyerForm, is_active: true })
    const { data } = await getFlyers(venueId)
    setFlyers(data || [])
    setFlyerForm({ title:"", description:"", image_url:"", valid_to:"" })
  }

  const removeFlyer = async (id) => {
    await deleteFlyer(id)
    setFlyers(f => f.filter(x => x.id !== id))
  }

  const addPromo = async () => {
    if (!promoForm.title.trim() || !night) return
    await createPromo({ night_id: night.id, ...promoForm, discount_pct: promoForm.discount_pct ? parseInt(promoForm.discount_pct) : null })
    const { data } = await getPromosForNight(night.id)
    setPromos(data || [])
    setPromoForm({ title:"", description:"", discount_pct:"" })
  }

  if (!authorized || !venue) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"}}>
      <div className="spinner"/>
    </div>
  )

  return (
    <div className="screen">
      <div className="scroll-area">
        <div style={{
          padding:"52px 20px 20px",
          background:"linear-gradient(180deg, rgba(245,158,11,0.15) 0%, transparent 100%)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <button className="back-btn" onClick={() => nav("/venue/" + venueId)}>←</button>
            <div>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:3, color:"var(--gold)", textTransform:"uppercase" }}>Panel Admin</div>
              <div style={{ fontSize:20, fontWeight:900, letterSpacing:"-0.5px" }}>{venue.name}</div>
            </div>
          </div>
        </div>

        <div style={{ display:"flex", margin:"0 16px 20px", gap:4 }}>
          {["noche","flyers","eventos","promos","ads"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1, padding:"9px 2px",
              background: tab===t ? "var(--grad-gold)" : "var(--surface)",
              border: tab===t ? "none" : "1px solid var(--border)",
              borderRadius:12, color: tab===t ? "#000" : "var(--gray)",
              fontSize:11, fontWeight:800, textTransform:"capitalize",
            }}>{t}</button>
          ))}
        </div>

        <div style={{ padding:"0 16px 80px" }}>

          {tab === "noche" && (
            <div>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:18 }}>
                {night ? "Noche activa hoy" : "Crear noche para hoy"}
              </div>
              <div className="input-group">
                <label>Genero musical</label>
                <select value={nightForm.music_genre} onChange={e => setNightForm(f => ({...f, music_genre:e.target.value}))}>
                  {MUSIC_GENRES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>DJ / Artista</label>
                <input placeholder="Nombre del DJ" value={nightForm.dj_name} onChange={e => setNightForm(f => ({...f, dj_name:e.target.value}))} />
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <div className="input-group" style={{ flex:1 }}>
                  <label>Apertura</label>
                  <input type="time" value={nightForm.open_time} onChange={e => setNightForm(f => ({...f, open_time:e.target.value}))} />
                </div>
                <div className="input-group" style={{ flex:1 }}>
                  <label>Cierre</label>
                  <input type="time" value={nightForm.close_time} onChange={e => setNightForm(f => ({...f, close_time:e.target.value}))} />
                </div>
              </div>
              <div className="input-group">
                <label>Precio entrada ($)</label>
                <input type="number" placeholder="0 = gratis" value={nightForm.cover_price} onChange={e => setNightForm(f => ({...f, cover_price:e.target.value}))} />
              </div>
              <button className="btn-gold" onClick={saveNight} disabled={saving} style={{ marginTop:8 }}>
                {saving ? "Guardando..." : night ? "Actualizar noche" : "Crear noche"}
              </button>
            </div>
          )}

          {tab === "flyers" && (
            <div>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:16 }}>Nuevo flyer</div>
              <div className="input-group">
                <label>Titulo</label>
                <input placeholder="Noche del Viernes..." value={flyerForm.title} onChange={e => setFlyerForm(f => ({...f, title:e.target.value}))} />
              </div>
              <div className="input-group">
                <label>Descripcion</label>
                <input value={flyerForm.description} onChange={e => setFlyerForm(f => ({...f, description:e.target.value}))} />
              </div>
              <div className="input-group">
                <label>URL de imagen (opcional)</label>
                <input placeholder="https://..." value={flyerForm.image_url} onChange={e => setFlyerForm(f => ({...f, image_url:e.target.value}))} />
              </div>
              <div className="input-group">
                <label>Válido hasta</label>
                <input type="date" value={flyerForm.valid_to} onChange={e => setFlyerForm(f => ({...f, valid_to:e.target.value}))} />
              </div>
              <button className="btn-primary" onClick={addFlyer}>Publicar flyer</button>
              {flyers.length > 0 && (
                <div style={{ marginTop:24 }}>
                  <div className="section-label" style={{ paddingLeft:0 }}>Flyers activos</div>
                  {flyers.map(fl => (
                    <div key={fl.id} style={{
                      display:"flex", alignItems:"center", gap:12,
                      padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)",
                      borderRadius:14, marginBottom:8,
                    }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700 }}>{fl.title}</div>
                        {fl.description && <div style={{ fontSize:12, color:"var(--gray)", marginTop:2 }}>{fl.description}</div>}
                        {fl.valid_to && <div style={{ fontSize:11, color:"var(--gray)", marginTop:2 }}>Hasta {fl.valid_to}</div>}
                      </div>
                      <button onClick={() => removeFlyer(fl.id)}
                        style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"6px 12px", color:"#fca5a5", fontSize:12, fontWeight:700 }}>
                        Borrar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "eventos" && (
            <div>
              {!night && (
                <div style={{ fontSize:13, color:"var(--gray)", marginBottom:20, lineHeight:1.6 }}>
                  Primero crea la noche de hoy para agregar eventos.
                </div>
              )}
              <div style={{ fontSize:15, fontWeight:800, marginBottom:16 }}>Agregar evento</div>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                <div className="input-group" style={{ width:64 }}>
                  <label>Emoji</label>
                  <input value={eventForm.emoji} onChange={e => setEventForm(f => ({...f, emoji:e.target.value}))} />
                </div>
                <div className="input-group" style={{ flex:1 }}>
                  <label>Nombre</label>
                  <input placeholder="Show, DJ set..." value={eventForm.name} onChange={e => setEventForm(f => ({...f, name:e.target.value}))} />
                </div>
              </div>
              <div className="input-group">
                <label>Hora de inicio</label>
                <input type="time" value={eventForm.start_time} onChange={e => setEventForm(f => ({...f, start_time:e.target.value}))} />
              </div>
              <div className="input-group">
                <label>Descripcion</label>
                <input value={eventForm.description} onChange={e => setEventForm(f => ({...f, description:e.target.value}))} />
              </div>
              <button className="btn-primary" onClick={addEvent} disabled={!night}>Agregar evento</button>
              {events.length > 0 && (
                <div style={{ marginTop:24 }}>
                  <div className="section-label" style={{ paddingLeft:0 }}>Eventos de hoy</div>
                  {events.map(ev => (
                    <div key={ev.id} style={{
                      display:"flex", alignItems:"center", gap:12,
                      padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)",
                      borderRadius:14, marginBottom:8,
                    }}>
                      <div style={{ fontSize:22 }}>{ev.emoji}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700 }}>{ev.name}</div>
                        {ev.start_time && <div style={{ fontSize:12, color:"var(--gray)" }}>{ev.start_time}</div>}
                      </div>
                      <button onClick={() => removeEvent(ev.id)}
                        style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"6px 12px", color:"#fca5a5", fontSize:12, fontWeight:700 }}>
                        Borrar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "promos" && (
            <div>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:16 }}>Nueva promocion</div>
              <div className="input-group">
                <label>Titulo</label>
                <input placeholder="2x1 en tragos..." value={promoForm.title} onChange={e => setPromoForm(f => ({...f, title:e.target.value}))} />
              </div>
              <div className="input-group">
                <label>Descripcion</label>
                <input value={promoForm.description} onChange={e => setPromoForm(f => ({...f, description:e.target.value}))} />
              </div>
              <div className="input-group">
                <label>Descuento %</label>
                <input type="number" min={0} max={100} placeholder="Ej: 50" value={promoForm.discount_pct} onChange={e => setPromoForm(f => ({...f, discount_pct:e.target.value}))} />
              </div>
              <button className="btn-primary" onClick={addPromo} disabled={!night}>Agregar promo</button>
              {promos.length > 0 && (
                <div style={{ marginTop:24 }}>
                  <div className="section-label" style={{ paddingLeft:0 }}>Promos activas</div>
                  {promos.map(pr => (
                    <div key={pr.id} style={{
                      padding:"12px 14px", background:"rgba(245,158,11,0.06)",
                      border:"1px solid rgba(245,158,11,0.2)", borderRadius:14, marginBottom:8,
                    }}>
                      <div style={{ fontSize:14, fontWeight:800, color:"var(--goldL)" }}>{pr.title}</div>
                      {pr.description && <div style={{ fontSize:12, color:"var(--grayL)", marginTop:2 }}>{pr.description}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "ads" && (
            <div>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:16 }}>Nueva publicidad</div>
              <div className="input-group">
                <label>Titulo</label>
                <input placeholder="Noche VIP, Mesa reservada..." value={adForm.title} onChange={e => setAdForm(f => ({...f, title:e.target.value}))} />
              </div>
              <div className="input-group">
                <label>Descripcion</label>
                <input value={adForm.description} onChange={e => setAdForm(f => ({...f, description:e.target.value}))} />
              </div>
              <button className="btn-primary" onClick={addAd}>Publicar</button>
              {ads.length > 0 && (
                <div style={{ marginTop:24 }}>
                  <div className="section-label" style={{ paddingLeft:0 }}>Publicidades activas</div>
                  {ads.map(a => (
                    <div key={a.id} style={{
                      display:"flex", alignItems:"center", gap:12,
                      padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)",
                      borderRadius:14, marginBottom:8,
                    }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700 }}>{a.title}</div>
                        {a.description && <div style={{ fontSize:12, color:"var(--gray)", marginTop:2 }}>{a.description}</div>}
                      </div>
                      <button onClick={() => removeAd(a.id)}
                        style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"6px 12px", color:"#fca5a5", fontSize:12, fontWeight:700 }}>
                        Borrar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
