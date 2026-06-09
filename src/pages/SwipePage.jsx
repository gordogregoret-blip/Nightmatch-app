import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { getUsersGoingTonight, sendLike, getMyLikesThisNight, checkMatch } from "../lib/supabase"

export default function SwipePage() {
  const { venueId, nightId } = useParams()
  const nav   = useNavigate()
  const { user } = useAuth()
  const [cards, setCards]     = useState([])
  const [idx, setIdx]         = useState(0)
  const [match, setMatch]     = useState(null)
  const [loading, setLoading] = useState(true)

  const startX  = useRef(0)
  const dragX   = useRef(0)
  const [offset, setOffset]   = useState(0)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await getUsersGoingTonight(nightId)
      const likedIds = await getMyLikesThisNight(user.id, nightId)
      const others = (data || []).filter(c => c.user_id !== user.id && !likedIds.includes(c.user_id))
      setCards(others)
      setLoading(false)
    }
    load()
  }, [nightId, user])

  const current = cards[idx]

  const doSwipe = async (dir) => {
    if (!current) return
    const profile = current.profiles
    if (dir === "right") {
      await sendLike(user.id, profile.id, venueId, nightId)
      const m = await checkMatch(user.id, profile.id, nightId)
      if (m) { setOffset(0); setMatch(profile); return }
    }
    setOffset(0)
    setIdx(i => i + 1)
  }

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    setDragging(true)
  }
  const onTouchMove = (e) => {
    if (!dragging) return
    const dx = e.touches[0].clientX - startX.current
    dragX.current = dx
    setOffset(dx)
  }
  const onTouchEnd = () => {
    setDragging(false)
    if (Math.abs(dragX.current) > 90) {
      doSwipe(dragX.current > 0 ? "right" : "left")
    } else {
      setOffset(0)
    }
    dragX.current = 0
  }

  const rot        = offset * 0.07
  const likeAlpha  = Math.min(1, offset / 70)
  const nopeAlpha  = Math.min(1, -offset / 70)

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#000"}}>
      <div className="spinner"/>
    </div>
  )

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:"#000" }}>

      {/* Header */}
      <div style={{
        padding:"52px 20px 12px",
        display:"flex", alignItems:"center", gap:12,
        background:"rgba(0,0,0,0.8)", backdropFilter:"blur(20px)",
        flexShrink:0,
      }}>
        <button className="back-btn" onClick={() => nav(-1)}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:20, fontWeight:900, letterSpacing:"-0.6px" }}>
            Night<span className="grad-text">Swipe</span>
          </div>
          <div style={{ fontSize:11, color:"var(--gray)", marginTop:1 }}>
            {Math.max(0, cards.length - idx)} personas disponibles
          </div>
        </div>
        <div style={{
          padding:"6px 14px",
          background:"rgba(233,30,140,0.1)",
          border:"1px solid rgba(233,30,140,0.25)",
          borderRadius:20, fontSize:12, fontWeight:700,
          color:"var(--pinkL)",
        }}>
          Expira 8am
        </div>
      </div>

      {/* Card area */}
      <div style={{
        flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        padding:"12px 14px", position:"relative",
      }}>
        {!current ? (
          <div className="empty-state">
            <div className="icon">💫</div>
            <h3>Ya los viste a todos</h3>
            <p>Volvé más tarde o revisá tus matches de esta noche.</p>
            <button className="btn-primary" onClick={() => nav("/chats")} style={{ marginTop:24, maxWidth:240 }}>
              Ver mis matches
            </button>
          </div>
        ) : (
          <>
            {/* Shadow card (next) */}
            {cards[idx + 1] && (
              <div style={{
                position:"absolute",
                width:"calc(100% - 28px)", height:480,
                borderRadius:28,
                background:"var(--bg3)",
                border:"1px solid var(--border)",
                transform:"scale(0.94) translateY(14px)",
                zIndex:0,
              }} />
            )}

            {/* Main swipe card */}
            <div
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              style={{
                position:"relative", width:"100%", height:480,
                borderRadius:28, overflow:"hidden",
                background:"linear-gradient(160deg, rgba(233,30,140,0.12) 0%, rgba(124,58,237,0.08) 50%, var(--bg3) 100%)",
                border:"1px solid rgba(233,30,140,0.2)",
                boxShadow:"0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(233,30,140,0.1)",
                transform:"translateX(" + offset + "px) rotate(" + rot + "deg)",
                transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.34,1.2,0.64,1)",
                zIndex:10, cursor:"grab", userSelect:"none",
              }}>

              {/* LIKE/NOPE stamps */}
              {likeAlpha > 0.05 && (
                <div className="swipe-like" style={{ opacity: likeAlpha }}>LIKE</div>
              )}
              {nopeAlpha > 0.05 && (
                <div className="swipe-nope" style={{ opacity: nopeAlpha }}>NOPE</div>
              )}

              {/* Avatar centrado */}
              <div style={{
                position:"absolute", top:"15%", left:"50%",
                transform:"translateX(-50%)",
              }}>
                <div className="avatar" style={{
                  width:110, height:110, fontSize:44,
                  background:"linear-gradient(135deg, var(--pink), var(--purple))",
                  boxShadow:"var(--glow-pink)",
                }}>
                  {(current.profiles?.name || "?")[0].toUpperCase()}
                </div>
              </div>

              {/* Bottom overlay */}
              <div style={{
                position:"absolute", bottom:0, left:0, right:0,
                background:"linear-gradient(0deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)",
                padding:"60px 24px 28px",
              }}>
                <div style={{ textAlign:"center", marginBottom:18 }}>
                  <div style={{ fontSize:30, fontWeight:900, letterSpacing:-0.8 }}>
                    {current.profiles?.name}
                    <span style={{ fontSize:20, color:"var(--grayL)", fontWeight:400, marginLeft:10 }}>
                      {current.profiles?.age}
                    </span>
                  </div>
                </div>

                {current.profiles?.music_prefs?.length > 0 && (
                  <div style={{ marginBottom:10, textAlign:"center" }}>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center" }}>
                      {current.profiles.music_prefs.map(m => (
                        <span key={m} className="chip active" style={{ fontSize:11, padding:"5px 12px" }}>{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {current.profiles?.drink_prefs?.length > 0 && (
                  <div style={{ textAlign:"center" }}>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center" }}>
                      {current.profiles.drink_prefs.map(d => (
                        <span key={d} className="chip active-gold" style={{ fontSize:11, padding:"5px 12px" }}>{d}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action buttons */}
      {current && (
        <div style={{
          padding:"16px 0 52px",
          display:"flex", justifyContent:"center", alignItems:"center", gap:28,
          flexShrink:0,
        }}>
          {/* Nope */}
          <button className="btn-circle" onClick={() => doSwipe("left")}
            style={{
              width:64, height:64,
              background:"rgba(239,68,68,0.1)",
              border:"2px solid rgba(239,68,68,0.35)",
              color:"#ef4444", fontSize:26,
            }}>
            ✕
          </button>

          {/* Like */}
          <button className="btn-circle" onClick={() => doSwipe("right")}
            style={{
              width:76, height:76,
              background:"var(--grad)",
              border:"none",
              color:"#fff", fontSize:30,
              boxShadow:"var(--glow-pink)",
            }}>
            ♥
          </button>

          {/* Skip */}
          <button className="btn-circle" onClick={() => setIdx(i => i + 1)}
            style={{
              width:48, height:48,
              background:"var(--surface2)",
              border:"1px solid var(--border2)",
              color:"var(--grayL)", fontSize:18,
            }}>
            ↷
          </button>
        </div>
      )}

      {/* Match overlay */}
      {match && (
        <div className="match-overlay">
          {/* Glow ring */}
          <div style={{
            width:140, height:140, borderRadius:"50%",
            background:"linear-gradient(135deg, var(--pink), var(--purple))",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:56, marginBottom:24,
            boxShadow:"var(--glow-pink), 0 0 80px rgba(233,30,140,0.25)",
            animation:"matchIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            🔥
          </div>

          <div style={{
            fontSize:11, fontWeight:800, letterSpacing:4,
            color:"var(--pink)", textTransform:"uppercase",
            textShadow:"var(--glow-pink)", marginBottom:14,
          }}>
            Es un Match
          </div>

          <div style={{ fontSize:36, fontWeight:900, letterSpacing:-1.2, marginBottom:8 }}>
            {match.name}
          </div>

          <div style={{ fontSize:14, color:"var(--grayL)", marginBottom:40, lineHeight:1.8 }}>
            Se gustan mutuamente.<br/>El match expira a las 8am.
          </div>

          <button className="btn-primary" onClick={() => { setMatch(null); nav("/chats") }}
            style={{ marginBottom:14, maxWidth:280 }}>
            💬 Empezar a chatear
          </button>
          <button className="btn-glass" onClick={() => { setMatch(null); setIdx(i => i + 1) }}
            style={{ maxWidth:280 }}>
            Seguir viendo
          </button>
        </div>
      )}
    </div>
  )
}
