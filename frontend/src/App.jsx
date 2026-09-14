import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/context/auth/AuthProvider.jsx";
import { NotificationProvider } from "@/features/notification/Components/NotificationProvider.jsx";
import { router } from "@/routes/index.jsx";
import { RouteErrorBoundary } from "@/app/RouteErrorBoundary.jsx";
/**
 * App root. Global providers wrap the router so every route has access to the
 * authenticated session (and, later, toast/socket providers).
 */
export default function App() {
  return (
    <RouteErrorBoundary>
      <AuthProvider>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>

        <NotificationProvider>
          <RouterProvider router={router} />
        </NotificationProvider>
      </AuthProvider>
    </RouteErrorBoundary>
  );
}
