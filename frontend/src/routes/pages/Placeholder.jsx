/**
 * Temporary route target. Feature pages replace these as each module plan runs.
 * Keeps the router tree valid and lets us verify guards/layouts before pages exist.
 */
export function Placeholder({ name }) {
  return (
    <div className="rounded-card bg-surface p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-ink">{name}</h1>
      <p className="mt-2 text-muted">Coming soon — built in the module plan.</p>
    </div>
  )
}
