import { Outlet } from 'react-router-dom'

/**
 * Layout for unauthenticated/public pages (Landing, Login, Register).
 * The public top bar (brand + Log in / Register) is a reusable component slotted
 * here once built — see the component inventory doc.
 */
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* <PublicNavbar /> — inventoried, built in the Identity plan */}
      <Outlet />
    </div>
  )
}
