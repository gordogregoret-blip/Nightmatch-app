import { useNavigate } from 'react-router-dom'

export default function BottomNav({ active }) {
  const nav = useNavigate()
  const items = [
    { id: 'feed',    icon: '🏠', label: 'Inicio',  path: '/' },
    { id: 'match',   icon: '💫', label: 'Match',   path: '/matching' },
    { id: 'chats',   icon: '💬', label: 'Chats',   path: '/chats' },
    { id: 'profile', icon: '👤', label: 'Perfil',  path: '/profile' },
  ]
  return (
    <div className="bottomnav">
      {items.map(it => (
        <div key={it.id} className={`bn-item${active === it.id ? ' active' : ''}`}
          onClick={() => nav(it.path)}>
          <div className="icon">{it.icon}</div>
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  )
}
