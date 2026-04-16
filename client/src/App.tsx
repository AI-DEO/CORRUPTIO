import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useToastStore } from './stores/toastStore'
import Toast from './components/ui/Toast'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LobbyListPage from './pages/LobbyListPage'
import GameLobbyPage from './pages/GameLobbyPage'
import GamePage from './pages/GamePage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const toastMessages = useToastStore((s) => s.messages)
  const dismissToast = useToastStore((s) => s.dismiss)

  return (
    <div className="min-h-screen bg-bg-primary">
      <Toast messages={toastMessages} onDismiss={dismissToast} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <LobbyListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lobby/:gameId"
          element={
            <ProtectedRoute>
              <GameLobbyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:gameId"
          element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
