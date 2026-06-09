import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { getMessages, sendMessage, subscribeToMessages } from "../lib/supabase"

export default function ChatPage() {
  const { matchId } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await getMessages(matchId)
      setMessages(data || [])
    }
    load()
    const sub = subscribeToMessages(matchId, (payload) => {
      setMessages(prev => [...prev, payload.new])
    })
    return () => { sub.unsubscribe?.() }
  }, [matchId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" })
  }, [messages])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText("")
    await sendMessage(matchId, user.id, trimmed)
    setSending(false)
  }

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const fmt = (ts) => {
    const d = new Date(ts)
    return d.getHours().toString().padStart(2,"0") + ":" + d.getMinutes().toString().padStart(2,"0")
  }

  return (
    <div className="screen">
      {/* Header */}
      <div style={{
        padding:"52px 16px 12px", display:"flex", alignItems:"center", gap:12,
        background:"rgba(6,6,12,0.95)", borderBottom:"1px solid var(--border)",
        flexShrink:0,
      }}>
        <button className="back-btn" onClick={() => nav("/chats")}>←</button>
        <div className="avatar" style={{
          width:38, height:38, fontSize:16,
          background:"linear-gradient(135deg, var(--purple), var(--pink))",
        }}>M</div>
        <div>
          <div style={{ fontSize:15, fontWeight:800 }}>Match</div>
          <div style={{ fontSize:11, color:"var(--gray)" }}>Esta noche</div>
        </div>
      </div>

      {/* Messages */}
      <div className="scroll-area" style={{ padding:"16px 16px 8px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign:"center", padding:40 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>👋</div>
            <div style={{ fontSize:14, color:"var(--gray)", lineHeight:1.6 }}>
              Es un match! Empecen a hablar.
            </div>
          </div>
        )}
        {messages.map(msg => {
          const mine = msg.sender_id === user.id
          return (
            <div key={msg.id} style={{
              display:"flex", justifyContent: mine ? "flex-end" : "flex-start",
              marginBottom:8,
            }}>
              <div style={{
                maxWidth:"75%", padding:"10px 14px",
                background: mine ? "var(--grad)" : "var(--surface2)",
                border: mine ? "none" : "1px solid var(--border)",
                borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                fontSize:14, lineHeight:1.5,
              }}>
                <div>{msg.content}</div>
                <div style={{ fontSize:10, color: mine ? "rgba(255,255,255,0.6)" : "var(--gray)", marginTop:3, textAlign:"right" }}>
                  {fmt(msg.created_at)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{
        padding:"10px 12px 32px", display:"flex", gap:8, alignItems:"center",
        background:"rgba(6,6,12,0.96)", borderTop:"1px solid var(--border)",
        flexShrink:0,
      }}>
        <input
          value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
          placeholder="Escribi un mensaje..."
          style={{
            flex:1, padding:"12px 16px",
            background:"var(--surface2)", border:"1px solid var(--border)",
            borderRadius:20, color:"var(--white)", fontSize:14, outline:"none",
          }}
        />
        <button onClick={handleSend} disabled={!text.trim() || sending}
          style={{
            width:44, height:44, borderRadius:14,
            background: text.trim() ? "var(--grad)" : "var(--surface2)",
            border:"none", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all 0.15s",
          }}>
          ↑
        </button>
      </div>
    </div>
  )
}
