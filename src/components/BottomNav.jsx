import { useNavigate } from 'react-router-dom'

const ITEMS = [
  { id: 'feed',    icon: '🌙', label: 'Venues',  path: '/' },
  { id: 'chats',   icon: '💬', label: 'Matches',  path: '/chats' },
  { id: 'profile', icon: '👤', label: 'Perfil',   path: '/profile' },
]

export default function BottomNav({ active }) {
  const nav = useNavigate()
  return (
    <div className="bottomnav">
      {ITEMS.map(it => (
        <button key={it.id}
          className={`bn-item${active === it.id ? ' active' : ''}`}
          onClick={() => nav(it.path)}
          style={{ background: 'none', border: 'none' }}>
          <div className="bn-icon">{it.icon}</div>
          <div className="bn-label">{it.label}</div>
          {active === it.id && <div className="bn-dot" />}
        </button>
      ))}
    </div>
  )
}
