import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/auth/useAuth.js'
import { homePathForRole } from '@/shared/utils/routing.js'

/**
 * Inverse of ProtectedRoute: pages only an anonymous visitor should see (login,
 * register). While the session resolves we render nothing (avoids a flash of the
 * form before redirect); an authenticated user is sent to their role home.
 */
export function GuestOnlyRoute() {
  const { status, role } = useAuth()

  if (status === 'loading') return null
  if (status === 'authenticated') return <Navigate to={homePathForRole(role)} replace />
  return <Outlet />
}
