import { Navigate, useLocation } from 'react-router-dom'
import { getSession, isRefreshTokenExpired } from '../../features/auth/session/authSession'

export function ProtectedRoute({ children }) {
  const location = useLocation()
  const session = getSession()
  const isAuthenticated = Boolean(session?.accessToken || session?.refreshToken) && !isRefreshTokenExpired()

  if (!isAuthenticated) {
    return <Navigate to="/iotroot/login" replace state={{ from: location.pathname }} />
  }

  return children
}
