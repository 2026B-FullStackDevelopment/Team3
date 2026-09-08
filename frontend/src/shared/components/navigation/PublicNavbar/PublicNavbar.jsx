import { Link } from 'react-router-dom'
import { cn } from '@/shared/utils/cn.js'
import { Brand } from '@/shared/components/Brand/Brand.jsx'
import { Button } from '@/shared/components/Button/Button.jsx'

/**
 * Public (unauthenticated) top bar shown over the Landing hero: brand, the
 * marketing anchor pill, and the Log in / Register Now actions. Presentation
 * only — no session, no service calls. Tailwind classes inlined.
 */

// Marketing anchors from the Landing sketch. These scroll to page sections
// (static this pass); "Food" is the active example in the sketch.
const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Food', href: '#food', active: true },
  { label: 'Contact', href: '#contact' },
]

const link =
  'rounded-full px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white'
// Active marketing anchor gets the coral pill from the sketch.
const linkActive = 'bg-[#c56f52] text-white hover:text-white'

export function PublicNavbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
      <Brand tone="light" />

      <nav className="hidden items-center gap-1 rounded-full bg-white/10 px-2 py-1 backdrop-blur-sm md:flex">
        {NAV_LINKS.map((item) => (
          <a key={item.label} href={item.href} className={cn(link, item.active && linkActive)}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="px-2 text-sm font-medium text-white/90 transition-colors hover:text-white"
        >
          Log in
        </Link>
        <Button to="/register" size="sm">
          Register Now
        </Button>
      </div>
    </header>
  )
}
