import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, getMessages, sendMessage, subscribeToMessages } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function ChatPage() {
  const { matchId } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const [messages, setMessages] = useState([])
  const [match, setMatch] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef()

  useEffect(() => {
    loadMatch()
    loadMessages()
    const sub = subscribeToMessages(matchId, (payload) => {
      if (payload.new) setMessages(prev => [...prev, payload.new])
    })
    return () => sub.unsubscribe?.()
  }, [matchId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMatch = async () => {
    const { data } = await supabase
      .from('matches')
      .select(`
        *, venues(name),
        user_a:profiles!matches_user_a_id_fkey(id, name),
        user_b:profiles!matches_user_b_id_fkey(id, name)
      `)
      .eq('id', matchId)
      .single()
    if (data) setMatch(data)
  }

  const loadMessages = async () => {
    const { data } = await getMessages(matchId)
    if (data) setMessages(data)
    setLoading(false)
  }

  const handleSend = async () => {
    if (!text.trim()) return
    const content = text.trim()
    setText('')
    await sendMessage(matchId, user.id, content)
  }

  const otherUser = match
    ? (match.user_a?.id === user?.id ? match.user_b : match.user_a)
    : null

  const expiresAt = match?.expires_at
    ? new Date(match.expires_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : '06:00'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--cardB)', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', color: 'var(--grayL)', fontSize: 18, cursor: 'pointer', marginBottom: 6 }}>←</button>
        <div style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600 }}>
          {match?.venues?.name} esta noche
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>{otherUser?.name}</div>
        <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
          Chat expira a las {expiresAt}hs
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <div className="spinner" />}
        <div style={{
          textAlign: 'center', fontSize: 12, color: 'var(--teal)',
          background: 'rgba(0,201,167,.08)', borderRadius: 20,
          padding: '6px 16px', margin: '0 20px'
        }}>
          ¡Match! Ambos van a {match?.venues?.name} esta noche 🎉
        </div>

        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id
          return (
            <div key={msg.id} style={{
              maxWidth: '75%', alignSelf: isMe ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                padding: '10px 14px',
                background: isMe ? 'var(--purple)' : 'var(--cardB)',
                borderRadius: isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                fontSize: 14, lineHeight: 1.4
              }}>{msg.content}</div>
              <div style={{
                fontSize: 10, color: 'var(--gray)', marginTop: 3,
                textAlign: isMe ? 'right' : 'left', padding: '0 4px'
              }}>
                {new Date(msg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 16px 28px', background: 'var(--cardB)',
        display: 'flex', gap: 10, alignItems: 'center',
        borderTop: '1px solid var(--border)'
      }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Escribí un mensaje..."
          style={{
            flex: 1, background: 'var(--dark)', border: '1px solid var(--border)',
            borderRadius: 22, padding: '10px 14px', color: 'var(--white)',
            fontSize: 14, outline: 'none'
          }} />
        <button onClick={handleSend}
          style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'var(--purple)', border: 'none',
            color: '#fff', fontSize: 18, flexShrink: 0
          }}>↑</button>
      </div>
    </div>
  )
}
