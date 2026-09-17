const PREMIUM_PERKS = [
  'Real-time alerts when matching listings go live',
  'Priority sorting by your current location',
  'Set unlimited notification preferences',
]

/** The premium perks bullet list (green check + text). */
export function PerkList() {
  return (
    <ul className="mt-4 space-y-2">
      {PREMIUM_PERKS.map((perk) => (
        <li key={perk} className="flex items-center gap-2 text-sm text-ink">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          {perk}
        </li>
      ))}
    </ul>
  )
}
