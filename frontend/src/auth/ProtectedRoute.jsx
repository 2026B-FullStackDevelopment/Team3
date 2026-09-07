import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth.js'

/**
 * Gate for authenticated-only routes. While the session is resolving we render
 * nothing to avoid a flash; anonymous users are sent to /login.
 */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return null
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}
