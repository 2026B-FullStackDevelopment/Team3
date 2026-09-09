import { cn } from '@/shared/utils/cn.js'
import { Button } from '@/shared/components/Button.jsx'
import { useHeroCarousel } from '@/features/identity/Hook/identityHook.js'
import Hero1 from '@/assets/hero-section/Hero1.webp'
import Hero2 from '@/assets/hero-section/Hero2.jpg'
import Hero3 from '@/assets/hero-section/Hero3.webp'
import Hero4 from '@/assets/hero-section/Hero4.avif'

/**
 * Landing hero: a full-bleed photo carousel (auto-advancing every 7s) behind a
 * dark overlay, with the eyebrow chip, headline, blurb, the "Get Started" CTA
 * into registration, the carousel dots and the scroll cue from the sketch.
 * Carousel state lives in useHeroCarousel; classes inlined (single-file rule).
 */

const SLIDES = [Hero1, Hero2, Hero3, Hero4]

export function Hero() {
  const { index, goTo } = useHeroCarousel(SLIDES.length, 7000)

  return (
    <>
      {/* Photo carousel — crossfades beneath the content. */}
      <div className="absolute inset-0 z-0">
        {SLIDES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-1000',
              i === index ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}
        {/* Dark scrims for headline legibility. */}
        <div className="absolute inset-0 bg-ink/55" />
        <div className="absolute inset-0 bg-linear-to-r from-ink/85 via-ink/40 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 md:px-10">
        <div className="flex flex-1 flex-col justify-center pt-24 pb-16">
          <span className="w-fit rounded-full border border-khaki-strong/40 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-khaki backdrop-blur-sm">
            Now live in 6 Vietnamese cities
          </span>

          <h1 className="mt-8 max-w-3xl font-heading text-5xl font-bold leading-[1.05] text-white md:text-6xl">
            Good food shouldn’t go to waste — or go unreached.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">
            AFF connects you with businesses giving away or selling surplus food nearby — free,
            affordable, and just around the corner.
          </p>

          <div className="mt-8">
            <Button to="/register" size="lg">
              Get Started
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {SLIDES.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-6 bg-danger' : 'w-6 bg-white/25 hover:bg-white/40',
                )}
              />
            ))}
          </div>
        </div>

        <p className="pb-8 text-center text-sm font-medium text-white/70">
          Scroll down for more information ⌄
        </p>
      </div>
    </>
  )
}
