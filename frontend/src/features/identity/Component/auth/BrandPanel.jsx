import { cn } from '@/shared/utils/cn.js'
import { Brand } from '@/shared/components/Brand.jsx'

/**
 * Left marketing panel of the auth split layout (presentation only): the brand
 * lockup, an eyebrow `chip`, a big `heading`, a `blurb`, and a list of
 * `features` ({ icon, title, text }) — over the olive gradient + faint botanical
 * backdrop from the sketch. Copy is fully prop-driven so Login/Register can swap
 * it per role. Tailwind classes inlined (single-file rule).
 */
export function BrandPanel({ chip, heading, blurb, features = [], className }) {
  return (
    <div
      className={cn(
        'relative flex h-full min-h-screen flex-col overflow-hidden ' +
          'bg-linear-to-br from-ink via-ink-soft to-[#3c4a33] p-10 text-white md:p-12',
        className,
      )}
    >
      {/* Faint botanical backdrop. */}
      <svg
        className="pointer-events-none absolute -bottom-10 -left-10 h-80 w-80 text-white/[0.06]"
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M100 190 C100 120 60 90 40 70 C70 80 95 110 100 150 C105 110 130 80 160 70 C140 90 100 120 100 190Z" />
        <path d="M100 150 C100 100 120 70 150 55" />
      </svg>

      <Brand tone="light" />

      <div className="mt-auto pt-16">
        {chip && (
          <span className="inline-block rounded-full bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-khaki">
            {chip}
          </span>
        )}
        {heading && (
          <h2 className="mt-6 max-w-sm font-heading text-4xl font-bold leading-[1.1] md:text-5xl">
            {heading}
          </h2>
        )}
        {blurb && <p className="mt-5 max-w-sm text-base leading-relaxed text-white/75">{blurb}</p>}
      </div>

      {features.length > 0 && (
        <ul className="mt-12 space-y-5">
          {features.map((f) => (
            <li key={f.title} className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-khaki">
                {f.icon}
              </span>
              <div>
                <p className="font-semibold text-white">{f.title}</p>
                <p className="text-sm text-white/70">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
