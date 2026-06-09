import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import BottomNav from "../components/BottomNav"
import { getProfile, updateProfile, signOut } from "../lib/supabase"

const MUSIC  = ["House","Techno","Reggaeton","Trap","Cumbia","Pop","R&B","Electronica"]
const DRINKS = ["Cerveza","Fernet","Whisky","Vodka","Gin","Vino","Champagne","Sin alcohol"]

export default function ProfilePage() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({ name:"", bio:"", music_prefs:[], drink_prefs:[] })

  useEffect(() => {
    const load = async () => {
      const { data } = await getProfile(user.id)
      if (data) {
        setProfile(data)
        setForm({ name: data.name || "", bio: data.bio || "", music_prefs: data.music_prefs || [], drink_prefs: data.drink_prefs || [] })
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

  const handleLogout = async () => {
    await signOut()
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
          padding:"60px 20px 32px", textAlign:"center",
          background:"radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.2) 0%, transparent 70%)",
        }}>
          <div className="avatar" style={{
            width:88, height:88, fontSize:36,
            background:"linear-gradient(135deg, var(--purple), var(--pink))",
            margin:"0 auto 16px",
          }}>
            {(profile.name || "?")[0].toUpperCase()}
          </div>
          <div style={{ fontSize:24, fontWeight:900, letterSpacing:"-0.6px" }}>{profile.name}</div>
          <div style={{ fontSize:14, color:"var(--gray)", marginTop:4 }}>
            {profile.age} años · {user.email}
          </div>
          {profile.bio && (
            <div style={{ fontSize:13, color:"var(--grayL)", marginTop:12, lineHeight:1.7, maxWidth:280, margin:"12px auto 0" }}>
              {profile.bio}
            </div>
          )}
          <button onClick={() => setEditing(true)} style={{
            marginTop:20, padding:"10px 24px",
            background:"var(--surface2)", border:"1px solid var(--border)",
            borderRadius:14, color:"var(--grayXL)", fontSize:13, fontWeight:600,
          }}>
            Editar perfil
          </button>
        </div>

        {/* Prefs */}
        <div style={{ padding:"0 16px 24px" }}>
          {profile.music_prefs?.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div className="section-label" style={{ paddingLeft:0 }}>Musica</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {profile.music_prefs.map(m => (
                  <span key={m} className="chip active">{m}</span>
                ))}
              </div>
            </div>
          )}
          {profile.drink_prefs?.length > 0 && (
            <div style={{ marginBottom:32 }}>
              <div className="section-label" style={{ paddingLeft:0 }}>Bebidas</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {profile.drink_prefs.map(d => (
                  <span key={d} className="chip active-gold">{d}</span>
                ))}
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="btn-glass">
            Cerrar sesion
          </button>
        </div>
      </div>
      <BottomNav active="profile"/>

      {/* Edit modal */}
      {editing && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(6,6,12,0.96)",
          backdropFilter:"blur(16px)", zIndex:200,
          display:"flex", flexDirection:"column",
          padding:"60px 0 0",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"0 20px 20px", borderBottom:"1px solid var(--border)" }}>
            <button className="back-btn" onClick={() => setEditing(false)}>×</button>
            <div style={{ flex:1, fontSize:17, fontWeight:800 }}>Editar perfil</div>
            <button onClick={handleSave} disabled={saving} style={{
              padding:"8px 18px", background:"var(--grad)", border:"none",
              borderRadius:12, color:"#fff", fontSize:13, fontWeight:700,
              opacity: saving ? 0.5 : 1,
            }}>
              {saving ? "..." : "Guardar"}
            </button>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"20px 20px 40px" }}>
            <div className="input-group">
              <label>Nombre</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} />
            </div>
            <div className="input-group">
              <label>Bio</label>
              <textarea rows={3} value={form.bio} onChange={e => setForm(f => ({...f, bio:e.target.value}))} placeholder="Contate algo..." />
            </div>
            <div style={{ marginBottom:24 }}>
              <div className="section-label" style={{ paddingLeft:0 }}>Musica (max 3)</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {MUSIC.map(m => (
                  <button key={m} type="button" onClick={() => toggleArr("music_prefs", m, 3)}
                    className={"chip" + (form.music_prefs.includes(m) ? " active" : "")}>{m}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="section-label" style={{ paddingLeft:0 }}>Bebidas (max 3)</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {DRINKS.map(d => (
                  <button key={d} type="button" onClick={() => toggleArr("drink_prefs", d, 3)}
                    className={"chip" + (form.drink_prefs.includes(d) ? " active-gold" : "")}>{d}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
