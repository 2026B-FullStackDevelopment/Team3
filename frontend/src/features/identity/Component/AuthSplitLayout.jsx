/**
 * Two-column responsive frame for the auth screens: the `left` marketing panel
 * and the `right` form column. Below md the left panel is hidden and the form
 * takes the full width (single-column mobile). Presentation only.
 * Tailwind classes inlined (single-file rule).
 */
export function AuthSplitLayout({ left, right }) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="hidden md:block">{left}</div>
      <div className="flex items-center justify-center bg-cream px-6 py-12">{right}</div>
    </div>
  )
}
