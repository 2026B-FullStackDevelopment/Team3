import { Outlet } from 'react-router-dom'
import { useAuth } from '@/context/auth/useAuth.js'
import { Navbar } from '@/shared/components/navigation/Navbar.jsx'
import { homePathForRole } from '@/shared/utils/routing.js'

/**
 * Authenticated shell for a role: the role-aware Navbar over a centered page
 * container. Replaces the old per-role layout shells (F12). Session data is read
 * here and passed into the presentational Navbar.
 */
export function RoleLayout({ role }) {
  const { user, logout } = useAuth()
  const home = homePathForRole(user?.role)
  return (
    <div className="min-h-screen bg-cream text-ink">
      <Navbar role={role} user={user} home={home} onLogout={logout} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
