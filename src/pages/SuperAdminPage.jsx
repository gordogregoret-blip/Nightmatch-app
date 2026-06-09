import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { getAllVenues, getAllUsers, createVenue, updateUserRole, getVenueMetrics } from "../lib/supabase"

export default function SuperAdminPage() {
  const { profile } = useAuth()
  const nav = useNavigate()
  const [tab, setTab]       = useState("overview")
  const [venues, setVenues] = useState([])
  const [users, setUsers]   = useState([])
  const [metrics, setMetrics] = useState({})
  const [loading, setLoading] = useState(true)

  // New venue form
  const [newVenue, setNewVenue] = useState({ name:"", address:"", lat:"", lng:"", description:"" })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    if (profile?.role !== "superadmin") {
      nav("/")
      return
    }
    const load = async () => {
      const [{ data: v }, { data: u }] = await Promise.all([
        getAllVenues(),
        getAllUsers(),
      ])
      const venueList = v || []
      setVenues(venueList)
      setUsers(u || [])
      // load metrics for each venue
      const m = {}
      await Promise.all(venueList.map(async venue => {
        m[venue.id] = await getVenueMetrics(venue.id)
      }))
      setMetrics(m)
      setLoading(false)
    }
    load()
  }, [profile])

  const handleCreateVenue = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg("")
    const { data, error } = await createVenue({
      name: newVenue.name,
      address: newVenue.address,
      lat: parseFloat(newVenue.lat) || 0,
      lng: parseFloat(newVenue.lng) || 0,
      description: newVenue.description,
      is_active: true,
    })
    if (error) { setMsg("Error: " + error.message); setSaving(false); return }
    setVenues(prev => [...prev, data])
    setNewVenue({ name:"", address:"", lat:"", lng:"", description:"" })
    setMsg("✅ Venue creado correctamente")
    setSaving(false)
  }

  const handleRoleChange = async (userId, role) => {
    const { error } = await updateUserRole(userId, role)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    }
  }

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"}}>
      <div className="spinner"/>
    </div>
  )

  if (profile?.role !== "superadmin") return null

  const totalCheckins = Object.values(metrics).reduce((s, m) => s + (m?.checkins||0), 0)
  const totalMatches  = Object.values(metrics).reduce((s, m) => s + (m?.matches||0), 0)
  const totalLikes    = Object.values(metrics).reduce((s, m) => s + (m?.likes||0), 0)

  const TABS = ["overview", "boliches", "usuarios"]

  return (
    <div className="screen">
      <div className="scroll-area">
        {/* HEADER */}
        <div style={{
          padding:"54px 22px 20px",
          background:"radial-gradient(ellipse 100% 60% at 50% 0%, rgba(233,30,140,0.18) 0%, transparent 70%)",
        }}>
          <button onClick={() => nav("/")} style={{
            background:"none", border:"none", color:"var(--gray)",
            fontSize:13, fontWeight:700, marginBottom:14, padding:0,
          }}>← Volver</button>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:3.5, color:"var(--pink)", textTransform:"uppercase", marginBottom:8 }}>
            SUPER ADMIN
          </div>
          <div style={{ fontSize:30, fontWeight:900, letterSpacing:-1 }}>
            Panel de Control
          </div>
        </div>

        {/* TABS */}
        <div style={{ display:"flex", margin:"0 16px 4px", gap:6 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1, padding:"10px 4px",
              background: tab===t ? "var(--grad)" : "var(--surface)",
              border: tab===t ? "none" : "1px solid var(--border)",
              borderRadius:12, color: tab===t ? "#fff" : "var(--gray)",
              fontSize:11, fontWeight:800, textTransform:"capitalize",
              boxShadow: tab===t ? "var(--glow-pink)" : "none",
            }}>{t}</button>
          ))}
        </div>

        <div style={{ padding:"16px 16px 100px" }}>

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
                <StatCard icon="🏠" label="Boliches" value={venues.length} color="var(--pink)" />
                <StatCard icon="👥" label="Usuarios" value={users.length} color="#7c3aed" />
                <StatCard icon="📍" label="Check-ins" value={totalCheckins} color="#0891b2" />
                <StatCard icon="💘" label="Matches" value={totalMatches} color="#e91e8c" />
              </div>
              <div style={{ background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:16, padding:"16px" }}>
                <div style={{ fontSize:13, fontWeight:800, color:"var(--goldL)", marginBottom:10 }}>❤️ Likes totales</div>
                <div style={{ fontSize:36, fontWeight:900 }}>{totalLikes}</div>
              </div>
            </div>
          )}

          {/* BOLICHES */}
          {tab === "boliches" && (
            <div>
              {/* Venue list */}
              <div style={{ marginBottom:20 }}>
                {venues.map(v => {
                  const m = metrics[v.id] || {}
                  return (
                    <div key={v.id} style={{
                      background:"var(--surface)", border:"1px solid var(--border)",
                      borderRadius:16, padding:"14px 16px", marginBottom:10,
                    }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                        <div>
                          <div style={{ fontSize:15, fontWeight:800 }}>{v.name}</div>
                          <div style={{ fontSize:12, color:"var(--gray)", marginTop:2 }}>📍 {v.address}</div>
                        </div>
                        <button onClick={() => nav("/venue-admin/" + v.id)} style={{
                          padding:"7px 12px", background:"var(--surface2)", border:"1px solid var(--border2)",
                          borderRadius:10, fontSize:11, fontWeight:700, color:"var(--grayXL)",
                        }}>⚙️ Panel</button>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                        <MiniStat label="Check-ins" value={m.checkins||0} />
                        <MiniStat label="Matches"   value={m.matches||0} />
                        <MiniStat label="Likes"     value={m.likes||0} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* New venue */}
              <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:20, padding:"18px" }}>
                <div style={{ fontSize:14, fontWeight:800, marginBottom:14 }}>+ Agregar boliche</div>
                <form onSubmit={handleCreateVenue} style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <Input placeholder="Nombre" value={newVenue.name} onChange={v => setNewVenue(p=>({...p,name:v}))} required />
                  <Input placeholder="Dirección" value={newVenue.address} onChange={v => setNewVenue(p=>({...p,address:v}))} />
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <Input placeholder="Latitud" value={newVenue.lat} onChange={v => setNewVenue(p=>({...p,lat:v}))} />
                    <Input placeholder="Longitud" value={newVenue.lng} onChange={v => setNewVenue(p=>({...p,lng:v}))} />
                  </div>
                  <Input placeholder="Descripción (opcional)" value={newVenue.description} onChange={v => setNewVenue(p=>({...p,description:v}))} />
                  {msg && <div style={{ fontSize:12, color: msg.startsWith("✅") ? "#6ee7b7" : "#f87171", fontWeight:600 }}>{msg}</div>}
                  <button type="submit" disabled={saving} style={{
                    padding:"13px", background:"var(--grad)", border:"none",
                    borderRadius:14, color:"#fff", fontSize:14, fontWeight:800,
                    boxShadow:"var(--glow-pink)", opacity: saving ? 0.6 : 1,
                  }}>{saving ? "Guardando…" : "Crear boliche"}</button>
                </form>
              </div>
            </div>
          )}

          {/* USUARIOS */}
          {tab === "usuarios" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {users.map(u => (
                <div key={u.id} style={{
                  background:"var(--surface)", border:"1px solid var(--border)",
                  borderRadius:16, padding:"14px 16px",
                  display:"flex", alignItems:"center", gap:12,
                }}>
                  <div style={{
                    width:44, height:44, borderRadius:14, flexShrink:0,
                    background:"var(--surface2)", border:"1px solid var(--border2)",
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
                  }}>
                    {u.avatar_url ? <img src={u.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:14}}/> : "👤"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:800, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {u.name || "Sin nombre"}
                    </div>
                    <div style={{ fontSize:11, color:"var(--gray)", marginTop:2 }}>
                      {new Date(u.created_at).toLocaleDateString("es-AR")}
                    </div>
                  </div>
                  <select
                    value={u.role || "user"}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    style={{
                      background:"var(--surface2)", border:"1px solid var(--border2)",
                      borderRadius:10, color:"#fff", padding:"6px 10px", fontSize:11, fontWeight:700,
                    }}>
                    <option value="user">Usuario</option>
                    <option value="venue_admin">Admin Boliche</option>
                    <option value="superadmin">SuperAdmin</option>
                  </select>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background:"var(--surface)", border:`1px solid ${color}22`,
      borderRadius:16, padding:"16px",
    }}>
      <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:28, fontWeight:900, color }}>{value}</div>
      <div style={{ fontSize:11, color:"var(--gray)", fontWeight:700, marginTop:2 }}>{label}</div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div style={{
      background:"var(--bg3)", borderRadius:10, padding:"8px 10px", textAlign:"center",
    }}>
      <div style={{ fontSize:16, fontWeight:900 }}>{value}</div>
      <div style={{ fontSize:10, color:"var(--gray)", fontWeight:700 }}>{label}</div>
    </div>
  )
}

function Input({ placeholder, value, onChange, required }) {
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      style={{
        background:"var(--surface2)", border:"1px solid var(--border2)",
        borderRadius:12, padding:"12px 14px", color:"#fff", fontSize:13,
        outline:"none", width:"100%", boxSizing:"border-box",
      }}
    />
  )
}
