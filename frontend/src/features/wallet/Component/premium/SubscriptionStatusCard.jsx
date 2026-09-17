import { Link } from 'react-router-dom'
import { Card } from '@/shared/components/Card.jsx'
import { Badge } from '@/shared/components/Badge.jsx'
import { formatShortDate } from '@/shared/utils/formatters.js'
import { PerkList } from '@/features/wallet/Component/premium/PerkList.jsx'

/** Active-subscription status for a premium recipient. */
export function SubscriptionStatusCard({ expiryDate }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-heading text-2xl font-bold text-ink">Premium Plan</h3>
          <p className="mt-1 text-muted">5 USD / month · paid from wallet</p>
          {expiryDate && (
            <p className="mt-1 text-sm text-muted">Renews {formatShortDate(expiryDate)}</p>
          )}
        </div>
        <Badge variant="success">Active</Badge>
      </div>
      <PerkList />
      <Link to="/profile" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
        Back to Profile &rarr;
      </Link>
    </Card>
  )
}
