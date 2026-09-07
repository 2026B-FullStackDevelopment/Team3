import { Outlet } from 'react-router-dom'

/**
 * Authenticated shell for Admin pages (responsive — SRS A.3.c).
 * Hosts <AdminNavbar /> (Audit Logs · Accounts · Listings) — inventoried in the
 * component doc, built in the Admin module plan.
 */
export function AdminShell() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* <AdminNavbar /> */}
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
