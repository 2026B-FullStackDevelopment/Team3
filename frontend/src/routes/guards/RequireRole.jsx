import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/auth/useAuth.js'
import { AppLoadingState } from '@/app/AppLoadingState.jsx'

/**
 * Role-based page authorization (SRS A.2.c). Renders the nested routes only when
 * the session's role is allowed; otherwise redirects to /forbidden. A
 * Donor/Recipient therefore can never mount Admin pages.
 *
 * Usage: <Route element={<RequireRole roles={[USER_ROLES.ADMIN]} />}> … </Route>
 */
export function RequireRole({ roles }) {
  const { status, role } = useAuth()

  if (status === 'loading') return <AppLoadingState />
  if (status === 'anonymous') return <Navigate to="/login" replace />
  if (!roles.includes(role)) return <Navigate to="/forbidden" replace />
  return <Outlet />
}
