import { useState } from "react"
import { supabase } from "../lib/supabase"

const MUSIC  = ["House","Techno","Reggaeton","Trap","Cumbia","Pop","R&B","Electronica"]
const DRINKS = ["Cerveza","Fernet","Whisky","Vodka","Gin","Vino","Champagne","Sin alcohol"]

export default function AuthPage() {
  const [mode, setMode]       = useState("login")
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [form, setForm]       = useState({ email:"", password:"", name:"", age:"", music:[], drinks:[] })

  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))
  const toggleArr = (key, val, max) => {
    const arr = form[key]
    if (arr.includes(val)) set(key, arr.filter(x => x !== val))
    else if (arr.length < max) set(key, [...arr, val])
  }

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError("")
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    setLoading(true); setError("")
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id, name: form.name, age: parseInt(form.age),
        music_prefs: form.music, drink_prefs: form.drinks,
      })
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:"#000" }}>
      {/* HERO */}
      <div style={{
        padding:"80px 28px 48px",
        textAlign:"center",
        background:"radial-gradient(ellipse 80% 50% at 50% 0%, rgba(233,30,140,0.2) 0%, transparent 70%)",
        position:"relative",
      }}>
        {/* Neon star icon */}
        <div style={{
          width:72, height:72, borderRadius:22, margin:"0 auto 24px",
          background:"#000",
          border:"1px solid rgba(233,30,140,0.3)",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 0 32px rgba(233,30,140,0.35), inset 0 0 20px rgba(233,30,140,0.08)",
        }}>
          <span style={{ fontSize:32 }}>✦</span>
        </div>
        <div style={{ fontSize:42, fontWeight:900, letterSpacing:-2, lineHeight:1 }}>
          Night<span className="grad-text">Match</span>
        </div>
        <div style={{ fontSize:13, color:"var(--grayL)", marginTop:14, lineHeight:1.8 }}>
          Conectate con personas que van al<br/>mismo boliche que vos esta noche
        </div>
      </div>

      {/* TAB SWITCHER */}
      <div style={{
        display:"flex", margin:"0 24px 28px",
        background:"rgba(255,255,255,0.04)",
        border:"1px solid var(--border2)",
        borderRadius:20, padding:4,
      }}>
        {["login","register"].map(m => (
          <button key={m} onClick={() => { setMode(m); setStep(1); setError("") }}
            style={{
              flex:1, padding:"13px",
              borderRadius:16, border:"none",
              background: mode===m ? "var(--grad)" : "transparent",
              color: mode===m ? "#fff" : "var(--gray)",
              fontWeight:800, fontSize:13,
              boxShadow: mode===m ? "var(--glow-pink)" : "none",
              transition:"all 0.25s",
            }}>
            {m === "login" ? "Iniciar sesion" : "Crear cuenta"}
          </button>
        ))}
      </div>

      {/* FORM */}
      <form onSubmit={mode==="login" ? handleLogin : handleRegister}
        style={{ padding:"0 24px 60px", flex:1 }}>

        {error && (
          <div style={{
            background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)",
            borderRadius:14, padding:"13px 16px", fontSize:13, color:"#fca5a5",
            marginBottom:18, lineHeight:1.5,
          }}>{error}</div>
        )}

        {mode === "login" && <>
          <div className="input-group">
            <label>Email</label>
            <input type="email" required placeholder="tu@email.com"
              value={form.email} onChange={e => set("email", e.target.value)} />
          </div>
          <div className="input-group">
            <label>Contrasena</label>
            <input type="password" required placeholder="••••••••"
              value={form.password} onChange={e => set("password", e.target.value)} />
          </div>
        </>}

        {mode === "register" && step === 1 && <>
          <div className="input-group">
            <label>Nombre</label>
            <input required placeholder="Tu nombre"
              value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div className="input-group">
            <label>Edad</label>
            <input type="number" required min={18} max={99} placeholder="18+"
              value={form.age} onChange={e => set("age", e.target.value)} />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" required placeholder="tu@email.com"
              value={form.email} onChange={e => set("email", e.target.value)} />
          </div>
          <div className="input-group">
            <label>Contrasena</label>
            <input type="password" required minLength={6} placeholder="Minimo 6 caracteres"
              value={form.password} onChange={e => set("password", e.target.value)} />
          </div>
        </>}

        {mode === "register" && step === 2 && <>
          {/* Music */}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:22, fontWeight:900, letterSpacing:-0.8, marginBottom:4 }}>
              Que musica te gusta?
            </div>
            <div style={{ fontSize:13, color:"var(--grayL)", marginBottom:16 }}>Elegi hasta 3</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {MUSIC.map(m => (
                <button key={m} type="button"
                  onClick={() => toggleArr("music", m, 3)}
                  className={"chip" + (form.music.includes(m) ? " active" : "")}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          {/* Drinks */}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:22, fontWeight:900, letterSpacing:-0.8, marginBottom:4 }}>
              Que tomas?
            </div>
            <div style={{ fontSize:13, color:"var(--grayL)", marginBottom:16 }}>Elegi hasta 3</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {DRINKS.map(d => (
                <button key={d} type="button"
                  onClick={() => toggleArr("drinks", d, 3)}
                  className={"chip" + (form.drinks.includes(d) ? " active-gold" : "")}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </>}

        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop:8 }}>
          {loading ? "..." : mode==="login" ? "Entrar" : step===1 ? "Continuar →" : "Crear cuenta"}
        </button>
        {mode==="register" && step===2 && (
          <button type="button" onClick={() => setStep(1)}
            className="btn-glass" style={{ marginTop:12 }}>
            ← Volver
          </button>
        )}
      </form>
    </div>
  )
}
