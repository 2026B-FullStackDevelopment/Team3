import { Outlet } from 'react-router-dom'

/**
 * Authenticated shell for Donor pages.
 * Hosts <DonorNavbar /> (My Listings · New Listing · Reports + user menu) —
 * inventoried in the component doc, built in the module plans.
 */
export function DonorShell() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* <DonorNavbar /> */}
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
