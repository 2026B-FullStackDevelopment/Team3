import { useState } from 'react'
import { Leaf, Menu, X } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

/**
 * Authenticated shell for Donor pages.
 * Hosts <DonorNavbar /> (My Listings · New Listing · Reports + user menu) —
 * inventoried in the component doc, built in the module plans.
 */
export function DonorShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigation = [
    { to: '/donor/dashboard', label: 'Dashboard' },
    { to: '/donor/listings', label: 'My Listing' },
    { to: '/donor/reservations', label: 'Reservation' },
    { to: '/donor/manual-donations', label: 'Entries' },
  ]

  return (
    <div className="donor-app-shell">
      <header className="donor-nav-shell">
        <NavLink className="aff-brand" to="/donor/dashboard" aria-label="AFF Donation dashboard"><span><Leaf /></span>AFF</NavLink>
        <button className="donor-menu-button" aria-expanded={menuOpen} aria-controls="donor-navigation" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X /> : <Menu />}<span className="sr-only">Menu</span></button>
        <nav id="donor-navigation" className={menuOpen ? 'open' : ''} aria-label="Donation navigation">
          {navigation.map((item) => <NavLink onClick={() => setMenuOpen(false)} key={item.to} to={item.to} className={({ isActive }) => isActive || (item.to === '/donor/listings' && location.pathname.startsWith('/donor/listings') && !location.pathname.endsWith('/reservations')) ? 'active' : ''}>{item.label}</NavLink>)}
        </nav>
        <span className="auth-later-badge">Development access</span>
      </header>
      <main id="main-content" className="donor-main">
        <Outlet />
      </main>
    </div>
  )
}
