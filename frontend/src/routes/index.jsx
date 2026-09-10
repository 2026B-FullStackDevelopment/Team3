import { createBrowserRouter, Navigate } from 'react-router-dom'
import { USER_ROLES } from '@/config/constants.js'
import { ProtectedRoute } from '@/auth/ProtectedRoute.jsx'
import { RequireRole } from '@/auth/RequireRole.jsx'
import { PublicLayout } from '@/layouts/PublicLayout.jsx'
import { RecipientShell } from '@/layouts/RecipientShell.jsx'
import { DonorShell } from '@/layouts/DonorShell.jsx'
import { AdminShell } from '@/layouts/AdminShell.jsx'
import { LandingPage } from '@/routes/pages/LandingPage.jsx'
import { ForbiddenPage } from '@/routes/pages/ForbiddenPage.jsx'
import { NotFoundPage } from '@/routes/pages/NotFoundPage.jsx'
import { Placeholder } from '@/routes/pages/Placeholder.jsx'
import { UserManagementPage } from '@/features/admin/pages/UserManagementPage.jsx'
import { ListingModerationPage } from '@/features/admin/pages/ListingModerationPage.jsx'

/**
 * Application route tree, gated by role (SRS A.2.c).
 * Placeholder targets are replaced as each module plan runs. Insertion points
 * for the in-scope modules (Identity, Wallet) are marked below.
 */
export const router = createBrowserRouter([
  // ---- Public ----
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      // Identity module (public) — built in the Identity plan:
      { path: '/login', element: <Placeholder name="Login" /> },
      { path: '/register/donor', element: <Placeholder name="Register — Donor" /> },
      { path: '/register/recipient', element: <Placeholder name="Register — Recipient" /> },
    ],
  },

  // ---- Authenticated ----
  {
    element: <ProtectedRoute />,
    children: [
      // Recipient area
      {
        element: <RequireRole roles={[USER_ROLES.RECIPIENT]} />,
        children: [
          {
            element: <RecipientShell />,
            children: [
              // Identity module: Profile — built in the Identity plan
              { path: '/profile', element: <Placeholder name="Recipient Profile" /> },
              // Wallet module — built in the Wallet plan
              { path: '/wallet', element: <Placeholder name="Wallet & Deposit" /> },
              { path: '/premium', element: <Placeholder name="Upgrade to Premium" /> },
            ],
          },
        ],
      },

      // Donor area
      {
        element: <RequireRole roles={[USER_ROLES.DONOR]} />,
        children: [
          {
            element: <DonorShell />,
            children: [
              { path: '/donor/profile', element: <Placeholder name="Donor Profile" /> },
            ],
          },
        ],
      },

      // Admin area
      {
        element: <RequireRole roles={[USER_ROLES.ADMIN]} />,
        children: [
          {
            element: <AdminShell />,
            children: [
              { path: '/admin', element: <Navigate to="/admin/listing-moderation" replace /> },
              { path: '/admin/listing-moderation', element: <ListingModerationPage /> },
              { path: '/admin/user-management', element: <UserManagementPage /> },
              { path: '/admin/audit-log', element: <Placeholder name="Audit Log" /> },
            ],
          },
        ],
      },
    ],
  },

  // ---- System ----
  { path: '/forbidden', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
])
