import { Card } from '@/shared/components/Card.jsx'
import { Button } from '@/shared/components/Button.jsx'

/** Empty state when a premium recipient has no preferences yet. */
export function PreferencesEmptyState({ onAdd }) {
  return (
    <Card className="flex flex-col items-center justify-center py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream text-ink">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </span>
      <p className="mt-4 text-lg font-semibold text-ink">No preferences yet</p>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Set up a preference and we&apos;ll notify you the moment a matching listing goes live — before anyone else sees it.
      </p>
      <Button
        className="mt-6"
        onClick={onAdd}
        leftIcon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        }
      >
        Add your first preference
      </Button>
    </Card>
  )
}
