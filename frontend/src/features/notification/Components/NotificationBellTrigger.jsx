import { NotificationBell } from "@/features/notification/Components/NotificationBell.jsx";
import { NotificationPanel } from "@/features/notification/Components/NotificationPanel.jsx";
import { useNotificationPanel } from "@/features/notification/Hook/useNotificationPanel.js";
import { useNotifications } from "@/features/notification/Hook/useNotifications.js";

export function NotificationBellTrigger() {
  const { open, close, toggle, wrapperRef, triggerRef, panelRef } =
    useNotificationPanel();
  const { unreadCount } = useNotifications();

  return (
    <div ref={wrapperRef} className="relative">
      <NotificationBell
        ref={triggerRef}
        count={unreadCount}
        max={99}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
      />
      {open && <NotificationPanel panelRef={panelRef} onClose={close} />}
    </div>
  );
}
