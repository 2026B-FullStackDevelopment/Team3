/**
 * Landing "About AFF" section (presentation only). A flat illustration card on
 * the left, the mission copy on the right, and the two headline stat cards
 * (global waste / cities live) beneath it — matching the full landing sketch.
 * Tailwind classes inlined (single-file rule).
 */

import aboutImage from '@/assets/about-section/About.jpg'

export function AboutSection() {
  return (
    <section id="about" className="bg-cream px-6 py-16 md:px-10 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center md:gap-16">
        {/* Photo card */}
        <div className="rounded-card bg-primary-soft/60 p-6 md:p-10">
          <div className="overflow-hidden rounded-xl">
            <img
              src={aboutImage}
              alt="Donated food packed into boxes at a community donation point"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="mt-5 text-center text-xs text-muted">
            Homes list surplus food; recipients discover and collect it.
          </p>
        </div>

        {/* Copy + stats */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">About AFF</p>
          <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-ink md:text-4xl">
            Rescuing good food, one listing at a time
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            The Affordable Food Federation connects businesses with surplus food — bakeries,
            markets, restaurants, farms — to people nearby looking for free or affordable options.
            We&rsquo;re building the fastest way to move good food from where it&rsquo;s excess to
            where it&rsquo;s needed, cutting waste and cutting costs at the same time.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-card bg-danger p-6 text-white">
              <p className="font-heading text-3xl font-bold">1.05B</p>
              <p className="mt-2 text-sm leading-snug text-white/85">
                tonnes of food wasted globally each year — the problem we exist to solve.
              </p>
            </div>
            <div className="rounded-card bg-khaki p-6 text-ink">
              <p className="font-heading text-3xl font-bold">6</p>
              <p className="mt-2 text-sm leading-snug text-ink/70">
                Vietnamese cities live on AFF today.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
