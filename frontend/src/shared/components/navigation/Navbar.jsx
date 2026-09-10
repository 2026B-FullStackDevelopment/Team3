import { Link } from 'react-router-dom'
import { cn } from '@/shared/utils/cn.js'
import { Brand } from '@/shared/components/Brand.jsx'
import { Button } from '@/shared/components/Button.jsx'
import { UserMenu } from '@/shared/components/navigation/UserMenu.jsx'

/**
 * Role-aware top bar (presentation only — session data arrives via props).
 * `public` renders the marketing bar over the Landing hero (light text on the
 * dark hero); authed roles render a solid surface bar with the role's links.
 * When a `user` is present the auth actions become the account UserMenu.
 * Tailwind classes inlined (single-file rule).
 */

// Marketing anchors for the public (Landing) bar.
const PUBLIC_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Food', href: '#food', active: true },
  { label: 'Contact', href: '#contact' },
]

// Authed link sets point at the current route tree (placeholders until built).
const ROLE_LINKS = {
  recipient: [
    { label: 'Profile', to: '/profile' },
    { label: 'Wallet', to: '/wallet' },
    { label: 'Premium', to: '/premium' },
  ],
  donor: [{ label: 'Profile', to: '/donor/profile' }],
  admin: [{ label: 'Admin', to: '/admin' }],
}

function PublicBar({ user, home, onLogout }) {
  const link =
    'rounded-full px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white'
  const linkActive = 'bg-[#c56f52] text-white hover:text-white'
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
      <Brand tone="light" />
      <nav className="hidden items-center gap-1 rounded-full bg-white/10 px-2 py-1 backdrop-blur-sm md:flex">
        {PUBLIC_LINKS.map((item) => (
          <a key={item.label} href={item.href} className={cn(link, item.active && linkActive)}>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        {user ? (
          <UserMenu user={user} home={home} onLogout={onLogout} tone="light" />
        ) : (
          <>
            <Link
              to="/login"
              className="px-2 text-sm font-medium text-white/90 transition-colors hover:text-white"
            >
              Log in
            </Link>
            <Button to="/register" size="sm">
              Register Now
            </Button>
          </>
        )}
      </div>
    </header>
  )
}

function AuthedBar({ role, user, home, onLogout }) {
  const links = ROLE_LINKS[role] ?? []
  return (
    <header className="sticky top-0 z-20 border-b border-khaki-strong/50 bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Brand tone="dark" />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-black/5 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <UserMenu user={user} home={home} onLogout={onLogout} tone="dark" />
      </div>
    </header>
  )
}

export function Navbar({ role = 'public', user, home, onLogout }) {
  if (role === 'public') return <PublicBar user={user} home={home} onLogout={onLogout} />
  return <AuthedBar role={role} user={user} home={home} onLogout={onLogout} />
}
