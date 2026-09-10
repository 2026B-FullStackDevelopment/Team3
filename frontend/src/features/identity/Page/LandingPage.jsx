import { Navbar } from '@/shared/components/navigation/Navbar.jsx'
import { Footer } from '@/shared/components/navigation/Footer.jsx'
import { Hero } from '@/features/identity/Component/Hero.jsx'
import { AboutSection } from '@/features/identity/Component/AboutSection.jsx'
import { HowItWorks } from '@/features/identity/Component/HowItWorks.jsx'
import { AvailableNow } from '@/features/identity/Component/AvailableNow.jsx'
import { useAuth } from '@/context/auth/useAuth.js'
import { homePathForRole } from '@/shared/utils/routing.js'

/**
 * Public landing page (route: /). A full-bleed dark hero with the public navbar
 * overlaid, followed by the cream marketing sections (About, How it works,
 * Available now) and the dark site footer — the full landing sketch. The navbar
 * lives here (not in PublicLayout) because the auth screens use their own split
 * layout without it.
 */
export function LandingPage() {
  const { status, user, role, logout } = useAuth()
  const isAuthed = status === 'authenticated'
  const home = homePathForRole(role)

  return (
    <div className="bg-cream text-ink">
      {/* Hero — full-bleed dark section */}
      <section className="relative min-h-screen overflow-hidden bg-ink text-white">
        {/* Olive gradient stands in for the hero photo. */}
        <div className="absolute inset-0 bg-linear-to-br from-ink via-ink-soft to-[#3c4a33]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.08),transparent_55%)]" />

        <Navbar role="public" user={isAuthed ? user : undefined} home={home} onLogout={logout} />
        <Hero
          ctaTo={isAuthed ? home : '/register'}
          ctaLabel={isAuthed ? 'Go to dashboard' : 'Get Started'}
        />
      </section>

      <AboutSection />
      <HowItWorks />
      <AvailableNow />
      <Footer />
    </div>
  )
}
