import { AuthProvider } from '@/auth/AuthProvider.jsx'
import { ApplicationRoutes } from '@/routes/index.jsx'
import { RouteErrorBoundary } from '@/app/RouteErrorBoundary.jsx'

/**
 * App root. Global providers wrap the router so every route has access to the
 * authenticated session (and, later, toast/socket providers).
 */
export default function App() {
  return (
    <RouteErrorBoundary>
      <AuthProvider>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <ApplicationRoutes />
      </AuthProvider>
    </RouteErrorBoundary>
  )
}
