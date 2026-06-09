import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import BottomNav from "../components/BottomNav"
import { getMyMatches } from "../lib/supabase"

export default function MatchesPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await getMyMatches(user.id)
      setMatches(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const getOther = (m) =>
    m.user_a_id === user?.id ? m.user_b : m.user_a

  return (
    <div className="screen">
      <div className="scroll-area">
        <div style={{
          padding:"54px 22px 20px",
          background:"radial-gradient(ellipse 100% 60% at 50% 0%, rgba(233,30,140,0.12) 0%, transparent 70%)",
        }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:3.5, color:"var(--gray)", textTransform:"uppercase", marginBottom:8 }}>
            TUS CONEXIONES
          </div>
          <div style={{ fontSize:34, fontWeight:900, letterSpacing:-1.5, lineHeight:1 }}>
            <span className="grad-text">Matches</span>
          </div>
        </div>

        <div className="neon-line" style={{ margin:"0 22px" }} />

        {!user ? (
          <div className="empty-state">
            <div className="icon">🔒</div>
            <h3>Iniciá sesión</h3>
            <p>Necesitás una cuenta para ver tus matches.</p>
            <button className="btn-pink" onClick={() => nav("/profile")}>Entrar</button>
          </div>
        ) : loading ? (
          <div className="spinner" />
        ) : matches.length === 0 ? (
          <div className="empty-state">
            <div className="icon">💘</div>
            <h3>Aún sin matches</h3>
            <p>Hacé check-in en un boliche y empezá a conectar con personas que van esta noche.</p>
            <button className="btn-pink" onClick={() => nav("/")}>Ver boliches</button>
          </div>
        ) : (
          <div style={{ padding:"20px 16px 32px", display:"flex", flexDirection:"column", gap:10 }}>
            {matches.map(m => {
              const other = getOther(m)
              return (
                <div key={m.id}
                  onClick={() => nav("/chat/" + m.id)}
                  style={{
                    background:"var(--bg3)", border:"1px solid var(--border)",
                    borderRadius:20, padding:"16px", cursor:"pointer",
                    display:"flex", gap:14, alignItems:"center",
                  }}>
                  <div style={{
                    width:56, height:56, borderRadius:18, flexShrink:0,
                    background:"linear-gradient(135deg, rgba(233,30,140,0.25), rgba(124,58,237,0.2))",
                    border:"1px solid rgba(233,30,140,0.35)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:24,
                  }}>
                    {other?.avatar_url
                      ? <img src={other.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:18 }} />
                      : "😊"
                    }
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:16, fontWeight:800 }}>{other?.name || "Desconocido"}</div>
                    <div style={{ fontSize:12, color:"var(--grayL)", marginTop:2 }}>
                      {other?.age && other.age + " años · "}
                      {m.venues?.name && "🏠 " + m.venues.name}
                    </div>
                    {other?.music_prefs?.length > 0 && (
                      <div style={{ fontSize:11, color:"var(--gray)", marginTop:4 }}>
                        🎵 {other.music_prefs.slice(0,2).join(", ")}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize:20, color:"var(--pink)" }}>💬</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav active="matches" />
    </div>
  )
}
