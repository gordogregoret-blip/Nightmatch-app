import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import BottomNav from "../components/BottomNav"
import { getMyMatches } from "../lib/supabase"

export default function ChatsPage() {
  const nav   = useNavigate()
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await getMyMatches(user.id)
      setMatches(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const getOther = (m) => m.user_a_id === user.id ? m.user_b : m.user_a

  const timeLeft = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date()
    if (diff < 0) return "Expirado"
    const h = Math.floor(diff / 3600000)
    const min = Math.floor((diff % 3600000) / 60000)
    return h > 0 ? h + "h " + min + "m" : min + "m"
  }

  return (
    <div className="screen">
      <div className="scroll-area">
        <div style={{ padding:"52px 20px 16px" }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:3, color:"var(--gray)", textTransform:"uppercase", marginBottom:6 }}>
            TUS
          </div>
          <div style={{ fontSize:30, fontWeight:900, letterSpacing:"-1px" }}>
            Match<span className="grad-text">es</span>
          </div>
        </div>

        {loading ? (
          <div className="spinner"/>
        ) : matches.length === 0 ? (
          <div className="empty-state">
            <div className="icon">💘</div>
            <h3>Sin matches aun</h3>
            <p>Hace swipe en un boliche esta noche para conectar con alguien.</p>
          </div>
        ) : (
          <div style={{ padding:"8px 16px 24px" }}>
            {matches.map(m => {
              const other = getOther(m)
              const tl    = timeLeft(m.expires_at)
              const exp   = tl === "Expirado"
              return (
                <div key={m.id} onClick={() => !exp && nav("/chat/" + m.id)}
                  style={{
                    display:"flex", alignItems:"center", gap:14,
                    padding:"14px 16px",
                    background: exp ? "var(--surface)" : "var(--surface2)",
                    border:"1px solid var(--border)",
                    borderRadius:18, marginBottom:10,
                    opacity: exp ? 0.5 : 1,
                    cursor: exp ? "default" : "pointer",
                    transition:"transform 0.15s",
                  }}>
                  <div className="avatar" style={{
                    width:54, height:54, fontSize:22,
                    background: exp ? "var(--surface3)" : "linear-gradient(135deg, var(--purple), var(--pink))",
                  }}>
                    {(other?.name || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:16, fontWeight:800, letterSpacing:"-0.3px" }}>
                      {other?.name}
                      <span style={{ fontSize:13, color:"var(--gray)", fontWeight:400, marginLeft:6 }}>
                        {other?.age}
                      </span>
                    </div>
                    {other?.music_prefs?.length > 0 && (
                      <div style={{ fontSize:12, color:"var(--gray)", marginTop:2 }}>
                        🎵 {other.music_prefs.slice(0,2).join(" · ")}
                      </div>
                    )}
                    {m.venues && (
                      <div style={{ fontSize:11, color:"var(--gray)", marginTop:2 }}>
                        📍 {m.venues.name}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{
                      fontSize:11, fontWeight:700,
                      color: exp ? "var(--gray)" : tl.includes("h") && parseInt(tl) < 2 ? "#fca5a5" : "var(--purpleL)",
                    }}>
                      {exp ? "Expirado" : "⏱ " + tl}
                    </div>
                    {!exp && (
                      <div style={{ fontSize:11, color:"var(--gray)", marginTop:4 }}>Chatear →</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav active="chats"/>
    </div>
  )
}
