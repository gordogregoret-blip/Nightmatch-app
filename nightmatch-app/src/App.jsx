import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import './index.css'

import AuthPage     from './pages/AuthPage'
import FeedPage     from './pages/FeedPage'
import VenuePage    from './pages/VenuePage'
import MatchingPage from './pages/MatchingPage'
import ChatPage     from './pages/ChatPage'
import ChatsPage    from './pages/ChatsPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}><div className="spinner" /></div>
  return user ? children : <Navigate to="/auth" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
      <Route path="/venue/:id" element={<PrivateRoute><VenuePage /></PrivateRoute>} />
      <Route path="/matching/:venueId/:nightId" element={<PrivateRoute><MatchingPage /></PrivateRoute>} />
      <Route path="/matching" element={<PrivateRoute><ChatsPage /></PrivateRoute>} />
      <Route path="/chat/:matchId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
      <Route path="/chats" element={<PrivateRoute><ChatsPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
