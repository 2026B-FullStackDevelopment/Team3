import { createBrowserRouter, Navigate } from "react-router-dom";
import { USER_ROLES } from "@/config/constants.js";
import { ProtectedRoute } from "@/routes/guards/ProtectedRoute.jsx";
import { GuestOnlyRoute } from "@/routes/guards/GuestOnlyRoute.jsx";
import { RequireRole } from "@/routes/guards/RequireRole.jsx";
import { RoleLayout } from "@/routes/layouts/RoleLayout.jsx";
import { LandingPage } from "@/features/marketing/Page/LandingPage.jsx";
import { LoginPage } from "@/features/identity/Page/auth/LoginPage.jsx";
import { RegisterPage } from "@/features/identity/Page/auth/RegisterPage.jsx";
import { RecipientProfilePage } from "@/features/identity/Page/profile/RecipientProfilePage.jsx";
import { DonorProfilePage } from "@/features/identity/Page/profile/DonorProfilePage.jsx";
import { WalletPage } from "@/features/wallet/Page/WalletPage.jsx";
import { PremiumPage } from "@/features/wallet/Page/PremiumPage.jsx";
import { NotificationPreferencesPage } from "@/features/notification/Page/NotificationPreferencesPage.jsx";
import { ForbiddenPage } from "@/routes/pages/ForbiddenPage.jsx";
import { NotFoundPage } from "@/routes/pages/NotFoundPage.jsx";
import { Placeholder } from "@/routes/pages/Placeholder.jsx";
import { DonationDashboardPage } from "@/features/donation/pages/DonationDashboardPage.jsx";
import { ListingFormPage } from "@/features/donation/pages/ListingFormPage.jsx";
import { ManualDonationPage } from "@/features/donation/pages/ManualDonationPage.jsx";
import { ListingDonationsPage } from "@/features/donation/pages/ListingDonationsPage.jsx";
import { CollectionHistoryPage } from "@/features/reservation/pages/CollectionHistoryPage.jsx";
import { UserManagementPage } from "@/features/admin/pages/UserManagementPage.jsx";
import { ListingModerationPage } from "@/features/admin/pages/ListingModerationPage.jsx";
import { AuditLogPage } from "@/features/admin/pages/AuditLogPage.jsx";
import { NotificationPage } from "@/features/notification/Page/NotificationPage.jsx";

/**
 * Application route tree, gated by role (SRS A.2.c). Public pages render
 * directly (Landing owns its navbar/footer; auth pages use AuthSplitLayout).
 * Authed pages sit under a role-aware RoleLayout. Placeholder targets are
 * replaced as each module plan runs.
 */
export const router = createBrowserRouter([
  // ---- Public ----
  { path: "/", element: <LandingPage /> },

  // Auth pages — only for anonymous visitors; logged-in users go to their home.
  {
    element: <GuestOnlyRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },

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
              { path: "/profile", element: <RecipientProfilePage /> },
              { path: "/browse", element: <Placeholder name="Browse" /> },
              { path: "/history", element: <CollectionHistoryPage /> },
              { path: "/notifications", element: <NotificationPage /> },
              {
                path: "/notification-preferences",
                element: <NotificationPreferencesPage />,
              },
              { path: "/wallet", element: <WalletPage /> },
              { path: "/premium", element: <PremiumPage /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole roles={[USER_ROLES.DONOR]} />,
        children: [
          {
            element: <RoleLayout role="donor" />,
            children: [
              {
                path: "/donor",
                element: <Navigate to="/donor/dashboard" replace />,
              },
              { path: "/donor/dashboard", element: <DonationDashboardPage /> },
              {
                path: "/donor/listings",
                element: <DonationDashboardPage listingsOnly />,
              },
              { path: "/donor/listings/new", element: <ListingFormPage /> },
              {
                path: "/donor/listings/:listingId/edit",
                element: <ListingFormPage mode="edit" />,
              },
              {
                path: "/donor/listings/:listingId/duplicate",
                element: <ListingFormPage mode="duplicate" />,
              },
              {
                path: "/donor/listings/:listingId/donations",
                element: <ListingDonationsPage />,
              },
              {
                path: "/donor/manual-donations",
                element: <ManualDonationPage />,
              },
              { path: "/donor/profile", element: <DonorProfilePage /> },
              { path: "/donor/notifications", element: <NotificationPage /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole roles={[USER_ROLES.ADMIN]} />,
        children: [
          {
            element: <RoleLayout role="admin" />,
            children: [
              {
                path: "/admin",
                element: <Navigate to="/admin/listing-moderation" replace />,
              },
              {
                path: "/admin/listing-moderation",
                element: <ListingModerationPage />,
              },
              {
                path: "/admin/user-management",
                element: <UserManagementPage />,
              },
              { path: "/admin/audit-log", element: <AuditLogPage /> },
            ],
          },
        ],
      },
    ],
  },

  // ---- System ----
  { path: "/forbidden", element: <ForbiddenPage /> },
  { path: "*", element: <NotFoundPage /> },
]);
