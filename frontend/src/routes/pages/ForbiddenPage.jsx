import { Link } from 'react-router-dom'

/** Shown when a signed-in user hits a page their role can't access (SRS A.2.c). */
export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-heading text-6xl font-bold text-primary">403</p>
      <h1 className="mt-4 text-2xl font-semibold text-ink">Access denied</h1>
      <p className="mt-2 text-muted">You don’t have permission to view this page.</p>
      <Link to="/" className="mt-6 rounded-full bg-primary px-6 py-2 font-semibold text-white hover:bg-primary-hover">
        Back to home
      </Link>
    </div>
  )
}
