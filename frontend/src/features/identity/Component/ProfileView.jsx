import { Card } from '@/shared/components/Card.jsx'
import { Button } from '@/shared/components/Button.jsx'
import { Badge } from '@/shared/components/Badge.jsx'
import { formatShortDate } from '@/shared/utils/format.js'
import { ProfileHeader } from '@/features/identity/Component/ProfileHeader.jsx'
import { ContactInfoList } from '@/features/identity/Component/ContactInfoList.jsx'
import { SubscriptionCard } from '@/features/identity/Component/SubscriptionCard.jsx'
import { PremiumUpsellCard } from '@/features/identity/Component/PremiumUpsellCard.jsx'

/**
 * Shared profile card (view mode) used by RecipientProfilePage and
 * DonorProfilePage. `contactItems` are role-specific; `showSubscription` toggles
 * the recipient-only subscription column + non-premium upsell. "Edit profile"
 * calls `onEdit` so the page can flip to the inline edit form. Presentation only.
 */
export function ProfileView({ profile, onEdit, contactItems, showSubscription }) {
  const name = profile.userName ?? profile.companyName ?? profile.email
  const sub = `${profile.email} · ${profile.city ?? 'Vietnam'}`
  const premiumBadge =
    showSubscription && profile.isPremium ? (
      <Badge variant="khaki">
        ★ Premium
        {profile.premiumExpiryDate ? ` — renews ${formatShortDate(profile.premiumExpiryDate)}` : ''}
      </Badge>
    ) : null

  return (
    <>
      <Card>
        <ProfileHeader name={name} sub={sub} avatarUrl={profile.avatarUrl} badge={premiumBadge} />
        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <ContactInfoList items={contactItems} />
          {showSubscription && <SubscriptionCard isPremium={!!profile.isPremium} />}
        </div>
        <Button variant="secondary" size="md" className="mt-8" leftIcon={<EditIcon />} onClick={onEdit}>
          Edit profile
        </Button>
      </Card>
      {showSubscription && !profile.isPremium && (
        <div className="mt-8">
          <PremiumUpsellCard />
        </div>
      )}
    </>
  )
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}
