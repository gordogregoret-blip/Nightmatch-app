import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import BottomNav from "../components/BottomNav"
import { getMyMatches } from "../lib/supabase"

export default function ChatsPage() {
  const nav = useNavigate()
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
    if (diff < 0) return null
    const h   = Math.floor(diff / 3600000)
    const min = Math.floor((diff % 3600000) / 60000)
    return h > 0 ? h + "h " + min + "m" : min + "m"
  }

  const active  = matches.filter(m => timeLeft(m.expires_at) !== null)
  const expired = matches.filter(m => timeLeft(m.expires_at) === null)

  return (
    <div className="screen">
      <div className="scroll-area">
        {/* Header */}
        <div style={{
          padding:"54px 22px 20px",
          background:"radial-gradient(ellipse 100% 50% at 50% 0%, rgba(233,30,140,0.1) 0%, transparent 70%)",
        }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:3.5, color:"var(--gray)", textTransform:"uppercase", marginBottom:8 }}>
            TUS
          </div>
          <div style={{ fontSize:34, fontWeight:900, letterSpacing:-1.5 }}>
            Match<span className="grad-text">es</span>
          </div>
        </div>

        <div className="neon-line" style={{ margin:"0 22px 8px" }} />

        {loading ? (
          <div className="spinner" />
        ) : matches.length === 0 ? (
          <div className="empty-state">
            <div className="icon">💘</div>
            <h3>Sin matches aun</h3>
            <p>Hace check-in en un boliche y swipeá para conectar con alguien esta noche.</p>
          </div>
        ) : (
          <div style={{ padding:"12px 16px 32px" }}>

            {active.length > 0 && (
              <>
                <div className="section-label">Activos 🔥</div>
                {active.map(m => <MatchCard key={m.id} match={m} other={getOther(m)} tl={timeLeft(m.expires_at)} nav={nav} expired={false} />)}
              </>
            )}

            {expired.length > 0 && (
              <>
                <div className="section-label" style={{ marginTop:8 }}>Expirados</div>
                {expired.map(m => <MatchCard key={m.id} match={m} other={getOther(m)} tl={null} nav={nav} expired={true} />)}
              </>
            )}
          </div>
        )}
      </div>
      <BottomNav active="chats" />
    </div>
  )
}

function MatchCard({ match, other, tl, nav, expired }) {
  const urgente = tl && parseInt(tl) < 2 && tl.includes("h")

  return (
    <div onClick={() => !expired && nav("/chat/" + match.id)}
      style={{
        display:"flex", alignItems:"center", gap:14,
        padding:"14px 16px",
        background: expired ? "var(--surface)" : "var(--bg3)",
        border:"1px solid " + (expired ? "var(--border)" : urgente ? "rgba(233,30,140,0.35)" : "var(--border2)"),
        borderRadius:20, marginBottom:10,
        opacity: expired ? 0.45 : 1,
        cursor: expired ? "default" : "pointer",
        boxShadow: (!expired && urgente) ? "0 0 20px rgba(233,30,140,0.15)" : "none",
      }}>

      {/* Avatar */}
      <div className="avatar" style={{
        width:54, height:54, fontSize:22, flexShrink:0,
        background: expired
          ? "var(--surface3)"
          : "linear-gradient(135deg, var(--pink), var(--purple))",
        boxShadow: expired ? "none" : "0 0 16px rgba(233,30,140,0.3)",
      }}>
        {(other?.name || "?")[0].toUpperCase()}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:16, fontWeight:900, letterSpacing:-0.3 }}>
          {other?.name}
          <span style={{ fontSize:13, color:"var(--grayL)", fontWeight:400, marginLeft:6 }}>
            {other?.age}
          </span>
        </div>
        {other?.music_prefs?.length > 0 && (
          <div style={{ fontSize:12, color:"var(--grayL)", marginTop:3 }}>
            🎵 {other.music_prefs.slice(0,2).join(" · ")}
          </div>
        )}
        {match.venues?.name && (
          <div style={{ fontSize:11, color:"var(--gray)", marginTop:2 }}>
            📍 {match.venues.name}
          </div>
        )}
      </div>

      <div style={{ textAlign:"right", flexShrink:0 }}>
        {expired ? (
          <div style={{ fontSize:11, color:"var(--gray)", fontWeight:600 }}>Expirado</div>
        ) : (
          <>
            <div style={{
              fontSize:12, fontWeight:800,
              color: urgente ? "var(--pinkL)" : "var(--grayXL)",
              textShadow: urgente ? "0 0 10px rgba(233,30,140,0.6)" : "none",
            }}>
              ⏱ {tl}
            </div>
            <div style={{ fontSize:11, color:"var(--gray)", marginTop:4 }}>Chat →</div>
          </>
        )}
      </div>
    </div>
  )
}
