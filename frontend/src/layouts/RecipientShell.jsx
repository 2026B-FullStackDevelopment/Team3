import { Outlet } from 'react-router-dom'
import { RecipientNavbar } from './RecipientNavbar'

/**
 * Authenticated shell for Recipient pages.
 * Hosts <RecipientNavbar /> (Browse · My Reservation · History + user menu) —
 * inventoried in the component doc, built in the module plans.
 */
export function RecipientShell() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <RecipientNavbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
