import { Link } from 'react-router-dom'
import { Badge } from '@/shared/components/Badge.jsx'

/** Recipient subscription status block (Premium active vs Free). */
export function SubscriptionCard({ isPremium }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">Subscription</p>
      <div className="rounded-card bg-cream p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-ink">{isPremium ? 'Premium Plan' : 'Free Plan'}</p>
            <p className="text-sm text-muted">
              {isPremium ? '5 USD / month via card' : 'No active subscription'}
            </p>
          </div>
          <Badge variant={isPremium ? 'success' : 'khaki'}>{isPremium ? 'Active' : 'Free'}</Badge>
        </div>
        {isPremium && (
          <Link
            to="/premium"
            className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Manage subscription &rarr;
          </Link>
        )}
      </div>
    </div>
  )
}
