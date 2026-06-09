import { useNavigate } from "react-router-dom"

const ITEMS = [
  { id: "feed",    icon: "✦",  label: "Boliches", path: "/" },
  { id: "matches", icon: "💘", label: "Matches",  path: "/matches" },
  { id: "chats",   icon: "💬", label: "Chats",    path: "/chats" },
  { id: "profile", icon: "👤", label: "Perfil",   path: "/profile" },
]

export default function BottomNav({ active }) {
  const nav = useNavigate()
  return (
    <div className="bottomnav">
      {ITEMS.map(it => (
        <button key={it.id}
          className={"bn-item" + (active === it.id ? " active" : "")}
          onClick={() => nav(it.path)}
          style={{ background:"none", border:"none" }}>
          <div className="bn-icon" style={{ fontSize: it.icon === "✦" ? 20 : 22 }}>{it.icon}</div>
          <div className="bn-label">{it.label}</div>
          {active === it.id && <div className="bn-dot" />}
        </button>
      ))}
    </div>
  )
}
