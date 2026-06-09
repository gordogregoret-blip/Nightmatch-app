import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import BottomNav from "../components/BottomNav"
import { getProfile, updateProfile, signOut } from "../lib/supabase"

const MUSIC  = ["House","Techno","Reggaeton","Trap","Cumbia","Pop","R&B","Electronica"]
const DRINKS = ["Cerveza","Fernet","Whisky","Vodka","Gin","Vino","Champagne","Sin alcohol"]

export default function ProfilePage() {
  const nav = useNavigate()
  const { user, profile: authProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({ name:"", bio:"", music_prefs:[], drink_prefs:[] })

  useEffect(() => {
    const load = async () => {
      const { data } = await getProfile(user.id)
      if (data) {
        setProfile(data)
        setForm({
          name: data.name || "",
          bio: data.bio || "",
          music_prefs: data.music_prefs || [],
          drink_prefs: data.drink_prefs || [],
        })
      }
    }
    load()
  }, [user])

  const toggleArr = (key, val, max) => {
    const arr = form[key]
    if (arr.includes(val)) setForm(f => ({ ...f, [key]: arr.filter(x => x !== val) }))
    else if (arr.length < max) setForm(f => ({ ...f, [key]: [...arr, val] }))
  }

  const handleSave = async () => {
    setSaving(true)
    await updateProfile(user.id, { name: form.name, bio: form.bio, music_prefs: form.music_prefs, drink_prefs: form.drink_prefs })
    const { data } = await getProfile(user.id)
    setProfile(data)
    setEditing(false)
    setSaving(false)
  }

  if (!profile) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"}}>
      <div className="spinner"/>
    </div>
  )

  return (
    <div className="screen">
      <div className="scroll-area">
        {/* Hero */}
        <div style={{
          padding:"60px 22px 32px", textAlign:"center",
          background:"radial-gradient(ellipse 80% 50% at 50% 0%, rgba(233,30,140,0.15) 0%, transparent 70%)",
        }}>
          {/* Avatar with glow */}
          <div style={{ position:"relative", display:"inline-block", marginBottom:20 }}>
            <div className="avatar" style={{
              width:96, height:96, fontSize:38,
              background:"linear-gradient(135deg, var(--pink), var(--purple))",
              boxShadow:"var(--glow-pink)",
            }}>
              {(profile.name || "?")[0].toUpperCase()}
            </div>
          </div>

          <div style={{ fontSize:26, fontWeight:900, letterSpacing:-0.8 }}>{profile.name}</div>
          <div style={{ fontSize:13, color:"var(--grayL)", marginTop:6 }}>
            {profile.age} anos · {user.email}
          </div>
          {profile.bio && (
            <div style={{ fontSize:14, color:"var(--grayL)", marginTop:14, lineHeight:1.8, maxWidth:280, margin:"14px auto 0" }}>
              {profile.bio}
            </div>
          )}

          <button onClick={() => setEditing(true)} style={{
            marginTop:22, padding:"11px 28px",
            background:"var(--surface2)",
            border:"1px solid var(--border2)",
            borderRadius:16, color:"var(--grayXL)",
            fontSize:13, fontWeight:700,
          }}>
            Editar perfil
          </button>
        </div>

        <div className="neon-line" style={{ margin:"0 22px" }} />

        {/* Prefs */}
        <div style={{ padding:"8px 20px 32px" }}>
          {profile.music_prefs?.length > 0 && (
            <div style={{ marginBottom:28 }}>
              <div className="section-label" style={{ paddingLeft:0 }}>🎵 Musica</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {profile.music_prefs.map(m => (
                  <span key={m} className="chip active">{m}</span>
                ))}
              </div>
            </div>
          )}

          {profile.drink_prefs?.length > 0 && (
            <div style={{ marginBottom:36 }}>
              <div className="section-label" style={{ paddingLeft:0 }}>🍹 Bebidas</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {profile.drink_prefs.map(d => (
                  <span key={d} className="chip active-gold">{d}</span>
                ))}
              </div>
            </div>
          )}

          {authProfile?.role === 'superadmin' && (
            <button onClick={() => nav("/superadmin")} style={{
              width:"100%", padding:"14px",
              background:"linear-gradient(135deg, rgba(233,30,140,0.15), rgba(124,58,237,0.15))",
              border:"1px solid rgba(233,30,140,0.35)",
              borderRadius:16, color:"var(--pink)", fontSize:14, fontWeight:800,
              marginBottom:10,
            }}>⚡ Panel SuperAdmin</button>
          )}
          {(authProfile?.role === 'venue_admin' || authProfile?.role === 'superadmin') && (
            <button onClick={() => nav("/")} style={{
              width:"100%", padding:"14px",
              background:"linear-gradient(135deg, rgba(245,158,11,0.12), rgba(234,179,8,0.08))",
              border:"1px solid rgba(245,158,11,0.3)",
              borderRadius:16, color:"var(--goldL)", fontSize:14, fontWeight:800,
              marginBottom:10,
            }}>🏠 Mis Boliches</button>
          )}
          <button onClick={() => signOut()} className="btn-glass">
            Cerrar sesion
          </button>
        </div>
      </div>

      <BottomNav active="profile" />

      {/* Edit sheet */}
      {editing && (
        <div style={{
          position:"fixed", inset:0,
          background:"rgba(0,0,0,0.97)",
          backdropFilter:"blur(20px)",
          zIndex:200, display:"flex", flexDirection:"column",
        }}>
          {/* Edit header */}
          <div style={{
            padding:"56px 20px 18px",
            borderBottom:"1px solid var(--border)",
            display:"flex", alignItems:"center", gap:12, flexShrink:0,
          }}>
            <button className="back-btn" onClick={() => setEditing(false)} style={{ fontSize:20 }}>×</button>
            <div style={{ flex:1, fontSize:18, fontWeight:900 }}>Editar perfil</div>
            <button onClick={handleSave} disabled={saving} style={{
              padding:"9px 20px",
              background: saving ? "var(--surface2)" : "var(--grad)",
              border:"none", borderRadius:14,
              color:"#fff", fontSize:13, fontWeight:800,
              boxShadow: saving ? "none" : "var(--glow-pink)",
              opacity: saving ? 0.5 : 1,
            }}>
              {saving ? "..." : "Guardar"}
            </button>
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:"22px 20px 48px" }}>
            <div className="input-group">
              <label>Nombre</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} />
            </div>
            <div className="input-group">
              <label>Bio</label>
              <textarea rows={3} value={form.bio}
                onChange={e => setForm(f => ({...f, bio:e.target.value}))}
                placeholder="Contate algo..." />
            </div>

            <div style={{ marginBottom:28, marginTop:8 }}>
              <div style={{ fontSize:16, fontWeight:900, marginBottom:4 }}>Musica</div>
              <div style={{ fontSize:12, color:"var(--grayL)", marginBottom:14 }}>Hasta 3 generos</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {MUSIC.map(m => (
                  <button key={m} type="button"
                    onClick={() => toggleArr("music_prefs", m, 3)}
                    className={"chip" + (form.music_prefs.includes(m) ? " active" : "")}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize:16, fontWeight:900, marginBottom:4 }}>Bebidas</div>
              <div style={{ fontSize:12, color:"var(--grayL)", marginBottom:14 }}>Hasta 3</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {DRINKS.map(d => (
                  <button key={d} type="button"
                    onClick={() => toggleArr("drink_prefs", d, 3)}
                    className={"chip" + (form.drink_prefs.includes(d) ? " active-gold" : "")}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
