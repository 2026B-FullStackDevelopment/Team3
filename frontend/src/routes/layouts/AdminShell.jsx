import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/shared/utils/cn.js'

/**
 * Secondary nav rail for the three Admin screens (Listing Moderation, User
 * Management, Audit Log). Nested inside RoleLayout, which already supplies
 * the shared top bar (brand, account menu, logout) — this component only
 * owns the rail + routing the Outlet between the three admin pages, so it
 * doesn't duplicate any of that chrome.
 */

const NAV_ITEMS = [
  { label: 'Listing Moderation', to: '/admin/listing-moderation' },
  { label: 'User Management', to: '/admin/user-management' },
  { label: 'Audit Log', to: '/admin/audit-log' },
]

export function AdminShell() {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
      <aside className="flex shrink-0 gap-2 overflow-x-auto rounded-card bg-primary p-3 md:w-56 md:flex-col md:overflow-visible">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'whitespace-nowrap rounded-card px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-white/15 font-bold text-white'
                  : 'font-medium text-white/70 hover:bg-white/10 hover:text-white',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
