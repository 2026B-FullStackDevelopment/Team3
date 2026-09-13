import { Link } from 'react-router-dom'
import { PageHeader } from '@/shared/components/PageHeader.jsx'
import { Alert } from '@/shared/components/Alert.jsx'
import { usePremium } from '@/features/wallet/Hook/premiumHook.js'
import { ResultBanner } from '@/features/wallet/Component/ResultBanner.jsx'
import { PremiumPlanCard } from '@/features/wallet/Component/premium/PremiumPlanCard.jsx'
import { SubscriptionStatusCard } from '@/features/wallet/Component/premium/SubscriptionStatusCard.jsx'

/**
 * Recipient Premium checkout page (route: /premium, Wallet module — F8). Shows the
 * offer + wallet balance (buy with a wallet charge) or the active-subscription status.
 */
export function PremiumPage() {
  const {
    balance,
    subscription,
    status,
    canAfford,
    priceVnd,
    result,
    isSubmitting,
    subscribe,
    dismissResult,
  } = usePremium()

  if (status === 'loading') return null

  return (
    <>
      <PageHeader
        title="Premium"
        subtitle="Upgrade to get real-time alerts for food that matches your needs."
      />

      {status === 'error' ? (
        <Alert variant="error">Couldn&apos;t load your subscription. Please refresh the page.</Alert>
      ) : (
        <>
          {result && (
            <ResultBanner
              variant={result.variant}
              title={result.title}
              message={result.message}
              onDismiss={dismissResult}
            >
              {result.variant === 'success' && (
                <Link to="/profile" className="text-sm font-semibold text-primary hover:underline">
                  Back to Profile &rarr;
                </Link>
              )}
            </ResultBanner>
          )}

          {subscription.isPremium ? (
            <SubscriptionStatusCard expiryDate={subscription.expiryDate} />
          ) : (
            <PremiumPlanCard
              balance={balance}
              priceVnd={priceVnd}
              canAfford={canAfford}
              isSubmitting={isSubmitting}
              onSubscribe={subscribe}
            />
          )}
        </>
      )}
    </>
  )
}
