import { Outlet } from "react-router-dom";
import { NotificationProvider } from "@/features/notification/Components/NotificationProvider.jsx";

/** Keeps the global notification feed inside React Router context. */
export function NotificationRootLayout() {
  return (
    <NotificationProvider>
      <Outlet />
    </NotificationProvider>
  );
}
