import { NotificationContext } from "@/features/notification/Hook/context.js";
import { useNotificationFeed } from "@/features/notification/Hook/useNotificationFeed.js";
import { NotificationToast } from "@/features/notification/Components/NotificationToast.jsx";

export function NotificationProvider({ children }) {
  const { value, toast, dismissToast } = useNotificationFeed();

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToast
        notification={toast}
        onDismiss={dismissToast}
        onSelect={value.selectNotification}
      />
    </NotificationContext.Provider>
  );
}
