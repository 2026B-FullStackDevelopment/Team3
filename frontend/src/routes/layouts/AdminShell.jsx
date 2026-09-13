import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/shared/utils/cn.js'
import { Brand } from '@/shared/components/Brand.jsx'

/**
 * Sidebar shell for the admin route group: a fixed green nav rail (logo +
 * section links) beside the routed page. Kept separate from RoleLayout
 * (top Navbar) because the admin design uses a persistent sidebar rather
 * than a top bar — branching RoleLayout on role would mix two different
 * layout paradigms in one component.
 */

const NAV_ITEMS = [
  { label: 'Listing Moderation', to: '/admin/listing-moderation' },
  { label: 'User Management', to: '/admin/user-management' },
  { label: 'Audit Log', to: '/admin/audit-log' },
]

export function AdminShell() {
  return (
    <div className="flex min-h-screen bg-cream text-ink">
      <aside className="flex w-64 shrink-0 flex-col gap-8 bg-primary px-6 py-8">
        <Brand tone="light" to="/admin" />
        <nav className="flex flex-col gap-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'text-base transition-colors',
                  isActive ? 'font-bold text-white' : 'font-medium text-white/60 hover:text-white/80',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
