import { createBrowserRouter } from 'react-router-dom'
import { USER_ROLES } from '@/config/constants.js'
import { ProtectedRoute } from '@/routes/ProtectedRoute.jsx'
import { RequireRole } from '@/routes/RequireRole.jsx'
import { RoleLayout } from '@/routes/RoleLayout.jsx'
import { LandingPage } from '@/features/identity/Page/LandingPage.jsx'
import { LoginPage } from '@/features/identity/Page/LoginPage.jsx'
import { RegisterPage } from '@/features/identity/Page/RegisterPage.jsx'
import { ForbiddenPage } from '@/routes/pages/ForbiddenPage.jsx'
import { NotFoundPage } from '@/routes/pages/NotFoundPage.jsx'
import { Placeholder } from '@/routes/pages/Placeholder.jsx'

/**
 * Application route tree, gated by role (SRS A.2.c). Public pages render
 * directly (Landing owns its navbar/footer; auth pages use AuthSplitLayout).
 * Authed pages sit under a role-aware RoleLayout. Placeholder targets are
 * replaced as each module plan runs.
 */
export const router = createBrowserRouter([
  // ---- Public ----
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // ---- Authenticated ----
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RequireRole roles={[USER_ROLES.RECIPIENT]} />,
        children: [
          {
            element: <RoleLayout role="recipient" />,
            children: [
              { path: '/profile', element: <Placeholder name="Recipient Profile" /> },
              { path: '/wallet', element: <Placeholder name="Wallet & Deposit" /> },
              { path: '/premium', element: <Placeholder name="Upgrade to Premium" /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole roles={[USER_ROLES.DONOR]} />,
        children: [
          {
            element: <RoleLayout role="donor" />,
            children: [{ path: '/donor/profile', element: <Placeholder name="Donor Profile" /> }],
          },
        ],
      },
      {
        element: <RequireRole roles={[USER_ROLES.ADMIN]} />,
        children: [
          {
            element: <RoleLayout role="admin" />,
            children: [{ path: '/admin', element: <Placeholder name="Admin" /> }],
          },
        ],
      },
    ],
  },

  // ---- System ----
  { path: '/forbidden', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
])
