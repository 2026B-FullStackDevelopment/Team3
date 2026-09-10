/** Page title + subtitle block. Presentation only. */
export function PageHeader({ title, subtitle }) {
  return (
    <header className="mb-8">
      <h1 className="font-heading text-3xl font-bold text-ink md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
    </header>
  )
}
