import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { getUsersGoingTonight, sendLike, getMyLikesThisNight, checkMatch } from "../lib/supabase"

export default function SwipePage() {
  const { venueId, nightId } = useParams()
  const nav   = useNavigate()
  const { user } = useAuth()
  const [cards, setCards]   = useState([])
  const [idx, setIdx]       = useState(0)
  const [liked, setLiked]   = useState([])
  const [match, setMatch]   = useState(null)
  const [loading, setLoading] = useState(true)

  // drag state
  const startX  = useRef(0)
  const startY  = useRef(0)
  const dragX   = useRef(0)
  const [offset, setOffset]   = useState(0)
  const [dragging, setDragging] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await getUsersGoingTonight(nightId)
      const likedIds = await getMyLikesThisNight(user.id, nightId)
      setLiked(likedIds)
      const others = (data || []).filter(c => c.user_id !== user.id && !likedIds.includes(c.user_id))
      setCards(others)
      setLoading(false)
    }
    load()
  }, [nightId, user])

  const current = cards[idx]

  const swipe = async (direction) => {
    if (!current) return
    const profile = current.profiles
    if (direction === "right") {
      await sendLike(user.id, profile.id, venueId, nightId)
      const m = await checkMatch(user.id, profile.id, nightId)
      if (m) { setMatch(profile); return }
    }
    setOffset(0)
    setIdx(i => i + 1)
  }

  // Touch handlers
  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
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
    if (Math.abs(dragX.current) > 100) {
      swipe(dragX.current > 0 ? "right" : "left")
    } else {
      setOffset(0)
    }
    dragX.current = 0
  }

  const rotation = offset * 0.08
  const likeOpacity = Math.min(1, offset / 80)
  const nopeOpacity = Math.min(1, -offset / 80)

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"}}>
      <div className="spinner"/>
    </div>
  )

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:"var(--bg)", position:"relative" }}>
      {/* Header */}
      <div style={{ padding:"52px 20px 12px", display:"flex", alignItems:"center", gap:12 }}>
        <button className="back-btn" onClick={() => nav(-1)}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:18, fontWeight:900, letterSpacing:"-0.5px" }}>
            Night<span className="grad-text">Swipe</span>
          </div>
          <div style={{ fontSize:11, color:"var(--gray)" }}>
            {cards.length - idx} personas disponibles
          </div>
        </div>
      </div>

      {/* Card area */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 16px", position:"relative" }}>
        {!current ? (
          <div className="empty-state">
            <div className="icon">💫</div>
            <h3>Ya viste a todos</h3>
            <p>Volvé mas tarde o revisa tus matches.</p>
            <button className="btn-primary" onClick={() => nav("/chats")} style={{ marginTop:16 }}>Ver Matches</button>
          </div>
        ) : (
          <>
            {/* Next card (shadow) */}
            {cards[idx + 1] && (
              <div style={{
                position:"absolute", width:"calc(100% - 32px)", height:480,
                borderRadius:28, overflow:"hidden",
                transform:"scale(0.95) translateY(16px)",
                background:"var(--surface)", border:"1px solid var(--border)",
                zIndex:0,
              }}/>
            )}

            {/* Current card */}
            <div
              ref={cardRef}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              style={{
                position:"relative", width:"100%", height:480,
                borderRadius:28, overflow:"hidden",
                background:"linear-gradient(180deg, rgba(168,85,247,0.2) 0%, var(--bg) 100%)",
                border:"1px solid var(--border2)",
                transform:`translateX(${offset}px) rotate(${rotation}deg)`,
                transition: dragging ? "none" : "transform 0.3s ease",
                zIndex:10, cursor:"grab",
                userSelect:"none",
              }}>

              {/* LIKE / NOPE stamps */}
              {likeOpacity > 0.05 && (
                <div className="swipe-like" style={{ opacity: likeOpacity }}>LIKE</div>
              )}
              {nopeOpacity > 0.05 && (
                <div className="swipe-nope" style={{ opacity: nopeOpacity }}>NOPE</div>
              )}

              {/* Profile info */}
              <div style={{ padding:"36px 28px 24px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
                {/* Avatar */}
                <div style={{ position:"absolute", top:40, left:"50%", transform:"translateX(-50%)" }}>
                  <div className="avatar" style={{
                    width:100, height:100, fontSize:40,
                    background:"linear-gradient(135deg, var(--purple), var(--pink))",
                  }}>
                    {(current.profiles?.name || "?")[0].toUpperCase()}
                  </div>
                </div>

                <div style={{ textAlign:"center", marginBottom:20 }}>
                  <div style={{ fontSize:28, fontWeight:900, letterSpacing:"-0.8px" }}>
                    {current.profiles?.name}
                    <span style={{ fontSize:20, color:"var(--gray)", fontWeight:400, marginLeft:8 }}>
                      {current.profiles?.age}
                    </span>
                  </div>
                </div>

                {current.profiles?.music_prefs?.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:10, fontWeight:800, letterSpacing:1.5, color:"var(--gray)", textTransform:"uppercase", marginBottom:8 }}>
                      Musica
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center" }}>
                      {current.profiles.music_prefs.map(m => (
                        <span key={m} className="chip active">{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {current.profiles?.drink_prefs?.length > 0 && (
                  <div>
                    <div style={{ fontSize:10, fontWeight:800, letterSpacing:1.5, color:"var(--gray)", textTransform:"uppercase", marginBottom:8 }}>
                      Toma
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center" }}>
                      {current.profiles.drink_prefs.map(d => (
                        <span key={d} className="chip active-gold">{d}</span>
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
        <div style={{ padding:"16px 0 48px", display:"flex", justifyContent:"center", gap:24 }}>
          <button className="btn-circle" onClick={() => swipe("left")}
            style={{ background:"rgba(239,68,68,0.15)", border:"2px solid rgba(239,68,68,0.4)", fontSize:28 }}>
            ✕
          </button>
          <button className="btn-circle" onClick={() => swipe("right")}
            style={{ background:"rgba(16,185,129,0.15)", border:"2px solid rgba(16,185,129,0.4)", fontSize:28, width:68, height:68 }}>
            ♥
          </button>
        </div>
      )}

      {/* Match overlay */}
      {match && (
        <div className="match-overlay">
          <div style={{ fontSize:64, marginBottom:16 }}>🔥</div>
          <div style={{ fontSize:12, fontWeight:800, letterSpacing:3.5, color:"var(--purple)", textTransform:"uppercase", marginBottom:12 }}>
            Es un Match
          </div>
          <div style={{ fontSize:32, fontWeight:900, letterSpacing:"-1px", marginBottom:8 }}>
            {match.name}
          </div>
          <div style={{ fontSize:14, color:"var(--gray)", marginBottom:40, lineHeight:1.6 }}>
            Se gustan mutuamente. El match expira a las 8am.
          </div>
          <button className="btn-primary" onClick={() => { setMatch(null); nav("/chats") }} style={{ marginBottom:14 }}>
            Empezar a chatear
          </button>
          <button className="btn-glass" onClick={() => { setMatch(null); setIdx(i => i + 1) }}>
            Seguir viendo
          </button>
        </div>
      )}
    </div>
  )
}
