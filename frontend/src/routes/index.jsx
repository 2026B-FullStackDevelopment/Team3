import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { USER_ROLES } from '@/config/constants.js'
import { ProtectedRoute } from '@/routes/guards/ProtectedRoute.jsx'
import { GuestOnlyRoute } from '@/routes/guards/GuestOnlyRoute.jsx'
import { RequireRole } from '@/routes/guards/RequireRole.jsx'
import { RoleLayout } from '@/routes/layouts/RoleLayout.jsx'
import { LandingPage } from '@/features/identity/Page/LandingPage.jsx'
import { LoginPage } from '@/features/identity/Page/LoginPage.jsx'
import { RegisterPage } from '@/features/identity/Page/RegisterPage.jsx'
import { ForbiddenPage } from '@/routes/pages/ForbiddenPage.jsx'
import { NotFoundPage } from '@/routes/pages/NotFoundPage.jsx'
import { Placeholder } from '@/routes/pages/Placeholder.jsx'
import { UserManagementPage } from '@/features/admin/pages/UserManagementPage.jsx'
import { ListingModerationPage } from '@/features/admin/pages/ListingModerationPage.jsx'
import { AuditLogPage } from '@/features/admin/pages/AuditLogPage.jsx'

/**
 * Application route tree, gated by role (SRS A.2.c). Public pages render
 * directly (Landing owns its navbar/footer; auth pages use AuthSplitLayout).
 * Authed pages sit under a role-aware RoleLayout. Placeholder targets are
 * replaced as each module plan runs.
 */
export const router = createBrowserRouter([
  // ---- Public ----
  { path: '/', element: <LandingPage /> },

  // Auth pages — only for anonymous visitors; logged-in users go to their home.
  {
    element: <GuestOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },

  // ---- Authenticated ----
  {
    // TESTING ONLY — auth guard bypassed. Restore before merging:
    // element: <ProtectedRoute />,
    element: <Outlet />,
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
        // TESTING ONLY — role guard bypassed. Restore before merging:
        // element: <RequireRole roles={[USER_ROLES.ADMIN]} />,
        element: <Outlet />,
        children: [
          {
            element: <RoleLayout role="admin" />,
            children: [
              { path: '/admin', element: <Navigate to="/admin/listing-moderation" replace /> },
              { path: '/admin/listing-moderation', element: <ListingModerationPage /> },
              { path: '/admin/user-management', element: <UserManagementPage /> },
              { path: '/admin/audit-log', element: <AuditLogPage /> },
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
