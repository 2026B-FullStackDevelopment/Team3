import { Navigate, useRoutes } from 'react-router-dom'
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
import { DonationDashboardPage } from '@/features/donation/pages/DonationDashboardPage.jsx'
import { ListingFormPage } from '@/features/donation/pages/ListingFormPage.jsx'
import { ManualDonationPage } from '@/features/donation/pages/ManualDonationPage.jsx'
import { ReservationHistoryPage, ReservationSelectorPage } from '@/features/donation/pages/ReservationPages.jsx'

/**
 * Application route tree, gated by role (SRS A.2.c).
 * Placeholder targets are replaced as each module plan runs. Insertion points
 * for the in-scope modules (Identity, Wallet) are marked below.
 */
const routes = [
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

  // ---- Donation development area ----
  // TODO(auth): Move this branch back beneath ProtectedRoute/RequireRole when
  // Login is implemented. Backend ownership remains server-scoped in dev.
  {
    element: <DonorShell />,
    children: [
      { path: '/donor', element: <Navigate to="/donor/dashboard" replace /> },
      { path: '/donor/dashboard', element: <DonationDashboardPage /> },
      { path: '/donor/listings', element: <DonationDashboardPage listingsOnly /> },
      { path: '/donor/listings/new', element: <ListingFormPage /> },
      { path: '/donor/listings/:listingId/edit', element: <ListingFormPage mode="edit" /> },
      { path: '/donor/listings/:listingId/duplicate', element: <ListingFormPage mode="duplicate" /> },
      { path: '/donor/listings/:listingId/reservations', element: <ReservationHistoryPage /> },
      { path: '/donor/reservations', element: <ReservationSelectorPage /> },
      { path: '/donor/manual-donations', element: <ManualDonationPage /> },
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

      // TODO(auth): Restore Donation routes here with the Donor role guard.

      // Admin area
      {
        element: <RequireRole roles={[USER_ROLES.ADMIN]} />,
        children: [
          {
            element: <AdminShell />,
            children: [
              { path: '/admin', element: <Placeholder name="Admin" /> },
            ],
          },
        ],
      },
    ],
  },

  // ---- System ----
  { path: '/forbidden', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]

export function ApplicationRoutes() {
  return useRoutes(routes)
}
