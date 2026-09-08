import { Link } from 'react-router-dom'
import { Brand } from '@/shared/components/Brand/Brand.jsx'

/**
 * Public site footer shown beneath the Landing page: brand blurb, the two link
 * columns (Recipients / Donors), and the "Get Started" email capture, over the
 * dark ink surface from the sketch. Presentation only — the email field is a
 * static capture stub (wired in a later pass). Tailwind classes inlined.
 */

const RECIPIENT_LINKS = [
  { label: 'Browse Food', to: '/register' },
  { label: 'How it Works', to: '/#services' },
  { label: 'Premium Subscription', to: '/premium' },
]

const DONOR_LINKS = [
  { label: 'List Food', to: '/register' },
  { label: 'Donor Dashboard', to: '/donor/profile' },
  { label: 'Pricing', to: '/#services' },
]

function FooterColumn({ heading, links }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-white/60">{heading}</p>
      <ul className="mt-4 space-y-3">
        {links.map((item) => (
          <li key={item.label}>
            <Link
              to={item.to}
              className="text-sm text-white/85 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer id="contact" className="bg-ink px-6 pt-14 pb-8 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand + blurb */}
          <div>
            <Brand tone="light" to="/" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Affordable Food Federation — redistributing surplus food, one listing at a time.
            </p>
          </div>

          <FooterColumn heading="For Recipients" links={RECIPIENT_LINKS} />
          <FooterColumn heading="For Donors" links={DONOR_LINKS} />

          {/* Email capture */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
              Get Started
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Sign up free and start finding food near you.
            </p>
            <form
              className="mt-4 flex items-center gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                aria-label="Email address"
                placeholder="you@email.com"
                className="h-10 min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className="h-10 shrink-0 rounded-full bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center">
          <p>© 2026 Affordable Food Federation. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/#" className="transition-colors hover:text-white/80">
              Privacy
            </Link>
            <Link to="/#" className="transition-colors hover:text-white/80">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
