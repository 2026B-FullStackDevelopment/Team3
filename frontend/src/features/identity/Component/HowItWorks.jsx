import { Link } from 'react-router-dom'
import { cn } from '@/shared/utils/cn.js'

/**
 * Landing "How AFF Works" section (presentation only). Two side-by-side panels
 * from the sketch: the olive Recipients flow and the khaki Donors flow, each a
 * numbered three-step list. Tailwind classes inlined (single-file rule).
 */

const RECIPIENT_STEPS = [
  {
    title: 'Set your city',
    body: 'Sign up and tell us where you are — we’ll show what’s nearby.',
  },
  {
    title: 'Browse & reserve',
    body: 'Search, filter by category or price, and reserve free or affordable listings.',
  },
  {
    title: 'Collect & pay if needed',
    body: 'Pick up at the listed time — pay by cash, card, or your AFF wallet.',
  },
]

const DONOR_STEPS = [
  {
    title: 'List your surplus',
    body: 'Set category, quantity and price, free or paid.',
  },
  {
    title: 'Recipients reserve',
    body: 'Track reservations in real time.',
  },
  {
    title: 'Hand off & track',
    body: 'See your reach and revenue in one place.',
  },
]

function StepList({ steps, tone }) {
  const badge =
    tone === 'dark'
      ? 'bg-white/15 text-white'
      : 'bg-primary/15 text-primary'
  const title = tone === 'dark' ? 'text-white' : 'text-ink'
  const body = tone === 'dark' ? 'text-white/70' : 'text-ink/60'

  return (
    <ol className="mt-6 space-y-5">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-4">
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              badge,
            )}
          >
            {i + 1}
          </span>
          <div>
            <p className={cn('font-semibold', title)}>{step.title}</p>
            <p className={cn('mt-0.5 text-sm leading-snug', body)}>{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function HowItWorks() {
  return (
    <section id="services" className="bg-cream px-6 pb-16 md:px-10 md:pb-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            How AFF Works
          </p>
          <h2 className="mx-auto mt-3 max-w-xl font-heading text-3xl font-bold leading-tight text-ink md:text-4xl">
            From surplus to your table, in three steps
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Recipients — olive panel */}
          <div className="rounded-card bg-[#4a5a2c] p-8 md:p-10">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-khaki">
              <span className="h-1.5 w-1.5 rounded-full bg-khaki" /> For Recipients
            </p>
            <h3 className="mt-4 font-heading text-2xl font-bold text-white">
              Find food near you, today
            </h3>
            <StepList steps={RECIPIENT_STEPS} tone="dark" />
          </div>

          {/* Donors — khaki panel */}
          <div className="rounded-card bg-khaki p-8 md:p-10">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> For Donors
            </p>
            <h3 className="mt-4 font-heading text-2xl font-bold text-ink">
              Turn surplus into impact
            </h3>
            <StepList steps={DONOR_STEPS} tone="light" />
            <Link
              to="/register"
              className="mt-7 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Become a Donor &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
