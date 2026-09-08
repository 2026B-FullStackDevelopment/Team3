import { PublicNavbar } from '@/shared/components/navigation/PublicNavbar/PublicNavbar.jsx'
import { SiteFooter } from '@/shared/components/navigation/SiteFooter/SiteFooter.jsx'
import { Hero } from '@/features/identity/components/Hero/Hero.jsx'
import { AboutSection } from '@/features/identity/components/AboutSection/AboutSection.jsx'
import { HowItWorks } from '@/features/identity/components/HowItWorks/HowItWorks.jsx'
import { AvailableNow } from '@/features/identity/components/AvailableNow/AvailableNow.jsx'

/**
 * Public landing page (route: /). A full-bleed dark hero with the public navbar
 * overlaid, followed by the cream marketing sections (About, How it works,
 * Available now) and the dark site footer — the full landing sketch. The navbar
 * lives here (not in PublicLayout) because the auth screens use their own split
 * layout without it.
 */
export function LandingPage() {
  return (
    <div className="bg-cream text-ink">
      {/* Hero — full-bleed dark section */}
      <section className="relative min-h-screen overflow-hidden bg-ink text-white">
        {/* Olive gradient stands in for the hero photo. */}
        <div className="absolute inset-0 bg-linear-to-br from-ink via-ink-soft to-[#3c4a33]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.08),transparent_55%)]" />

        <PublicNavbar />
        <Hero />
      </section>

      <AboutSection />
      <HowItWorks />
      <AvailableNow />
      <SiteFooter />
    </div>
  )
}
