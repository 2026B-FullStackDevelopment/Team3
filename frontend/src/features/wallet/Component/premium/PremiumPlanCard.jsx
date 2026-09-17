import { Link } from 'react-router-dom'
import { Card } from '@/shared/components/Card.jsx'
import { Button } from '@/shared/components/Button.jsx'
import { Badge } from '@/shared/components/Badge.jsx'
import { formatVnd } from '@/shared/utils/formatters.js'
import { PerkList } from '@/features/wallet/Component/premium/PerkList.jsx'

/** The Premium offer for a non-premium recipient. */
export function PremiumPlanCard({
  balance,
  priceVnd,
  canAfford,
  isSubmitting,
  onSubscribe,
  onSubscribeCard,
  isCardSubmitting,
}) {
  return (
    <Card className="border border-primary/40">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <Badge variant="khaki">★ Recommended for you</Badge>
          <h3 className="mt-3 font-heading text-2xl font-bold text-ink">Upgrade to Premium</h3>
          <p className="mt-1 text-muted">Never miss food that matches what you need.</p>
          <PerkList />
        </div>
        <div className="shrink-0 md:text-right">
          <p className="font-heading text-3xl font-bold text-ink">
            $5<span className="text-base font-medium text-muted">/month</span>
          </p>
          <p className="text-sm text-muted">{formatVnd(priceVnd)} from your wallet</p>
          <p className="mt-2 text-sm text-muted">
            Wallet balance: <span className="font-semibold text-ink">{formatVnd(balance)}</span>
          </p>
          {canAfford ? (
            <Button size="lg" className="mt-4" loading={isSubmitting} onClick={onSubscribe}>
              Confirm &amp; Pay {formatVnd(priceVnd)}
            </Button>
          ) : (
            <div className="mt-4">
              <Button size="lg" disabled>
                Confirm &amp; Pay {formatVnd(priceVnd)}
              </Button>
              <p className="mt-2 text-sm text-danger">
                Not enough balance.{' '}
                <Link to="/wallet" className="font-semibold underline">
                  Top up your wallet
                </Link>
              </p>
            </div>
          )}
          <Button
            size="lg"
            variant="secondary"
            className="mt-3 w-full"
            loading={isCardSubmitting}
            onClick={onSubscribeCard}
          >
            Pay with card
          </Button>
        </div>
      </div>
    </Card>
  )
}
