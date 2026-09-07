import { Link } from 'react-router-dom'

/** Catch-all 404. */
export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-heading text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-ink">Page not found</h1>
      <Link to="/" className="mt-6 rounded-full bg-primary px-6 py-2 font-semibold text-white hover:bg-primary-hover">
        Back to home
      </Link>
    </div>
  )
}
