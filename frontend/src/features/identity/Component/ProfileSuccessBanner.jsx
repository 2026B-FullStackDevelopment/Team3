/** Green "Profile updated successfully" banner shown after an edit save. */
export function ProfileSuccessBanner() {
  return (
    <div className="mb-6 flex items-center gap-4 rounded-card border-l-4 border-primary bg-surface p-5 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </span>
      <div>
        <p className="font-semibold text-ink">Profile updated successfully</p>
        <p className="text-sm text-muted">Your changes have been saved.</p>
      </div>
    </div>
  )
}
