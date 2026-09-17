import { Button } from '@/shared/components/Button.jsx'
import { Badge } from '@/shared/components/Badge.jsx'

const PERKS = [
  'Real-time alerts when matching listings go live',
  'Priority sorting by your current location',
  'Set unlimited notification preferences',
]

/** Non-premium recipient upsell. The upgrade action lives in Wallet (F8). */
export function PremiumUpsellCard() {
  return (
    <div className="rounded-card border border-green-500/40 bg-white/95 p-6 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge variant="khaki">★ Recommended for you</Badge>
          <h3 className="mt-3 font-heading text-2xl font-bold text-ink">Upgrade to Premium</h3>
          <p className="mt-1 text-muted">Never miss food that matches what you need.</p>
          <ul className="mt-4 space-y-2">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-ink">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-heading text-3xl font-bold text-ink">
            $5<span className="text-base font-medium text-muted">/month</span>
          </p>
          <p className="text-sm text-muted">Cancel anytime</p>
          <Button to="/premium" size="lg" className="mt-4">
            Upgrade now
          </Button>
        </div>
      </div>
    </div>
  )
}
