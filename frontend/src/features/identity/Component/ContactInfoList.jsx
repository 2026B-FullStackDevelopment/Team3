/** Vertical label/value list (Username, Email, City, Password…). */
export function ContactInfoList({ items }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">Contact Info</p>
      <dl className="space-y-3">
        {items.map((it) => (
          <div key={it.label}>
            <dt className="text-sm text-muted">{it.label}</dt>
            <dd className="font-semibold text-ink">{it.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
