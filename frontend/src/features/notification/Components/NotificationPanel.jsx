import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth/useAuth.js";
import { cn } from "@/shared/utils/cn.js";
import { NotificationItem } from "@/features/notification/Components/NotificationItem.jsx";
import { useNotificationFilter } from "@/features/notification/Hook/useNotificationFilter.js";
import { useNotifications } from "@/features/notification/Hook/useNotifications.js";

export function NotificationPanel({ panelRef, onClose }) {
  const { role } = useAuth();
  const {
    entries,
    unreadEntries,
    unreadCount,
    unreadStatus,
    status,
    socketStatus,
    error,
    selectNotification,
    markAllRead,
    soundEnabled,
    soundBlocked,
    enableSound,
    toggleSound,
    loadUnread,
  } = useNotifications();

  const { filter, setFilter, visibleEntries } = useNotificationFilter(
    entries,
    unreadEntries,
    5,
  );
  const selectFilter = (value) => {
    setFilter(value);
    if (value === "unread") loadUnread();
  };
  const filteredStatus = filter === "unread" ? unreadStatus : status;
  const feedPath = role === "Donor" ? "/donor/notifications" : "/notifications";
  const selectAndClose = async (notification) => {
    await selectNotification(notification);
    onClose();
  };

  return (
    <section
      ref={panelRef}
      role="dialog"
      tabIndex="-1"
      aria-label="Notifications panel"
      className="fixed inset-x-4 top-20 z-40 overflow-hidden rounded-card border border-khaki-strong bg-surface text-ink shadow-2xl outline-none sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-96"
    >
      <div className="flex items-center justify-between gap-3 border-b border-khaki px-4 py-3">
        <div>
          <h2 className="font-heading text-base font-semibold">
            Notifications
          </h2>
          <p className="text-xs text-muted">{unreadCount} unread</p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="min-h-11 text-sm font-semibold text-primary hover:text-primary-hover disabled:cursor-not-allowed disabled:text-muted"
        >
          Mark all read
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-khaki px-4 py-2">
        <div className="flex gap-1" aria-label="Notification filters">
          {["all", "unread"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => selectFilter(value)}
              aria-pressed={filter === value}
              className={cn(
                "min-h-11 rounded-full px-3 text-sm font-medium capitalize",
                filter === value
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:bg-cream",
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={soundBlocked ? enableSound : toggleSound}
          className="min-h-11 rounded-full px-2 text-xs font-semibold text-muted hover:bg-cream hover:text-ink"
          aria-pressed={soundEnabled}
        >
          {soundBlocked
            ? "Enable sound"
            : `Sound ${soundEnabled ? "on" : "off"}`}
        </button>
      </div>

      {socketStatus !== "connected" && (
        <p
          className="border-b border-khaki bg-cream px-4 py-2 text-xs text-muted"
          role="status"
        >
          {socketStatus === "connecting"
            ? "Connecting to live updates…"
            : "Live updates are disconnected. Saved notifications still work."}
        </p>
      )}
      {soundBlocked && soundEnabled && (
        <p className="border-b border-khaki bg-danger-soft px-4 py-2 text-xs text-danger">
          Your browser blocked sound. Use Enable sound after interacting with
          the page.
        </p>
      )}
      {error && (
        <p className="border-b border-khaki bg-danger-soft px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="max-h-[min(60vh,30rem)] overflow-y-auto">
        {filteredStatus === "loading" && visibleEntries.length === 0 && (
          <div className="space-y-3 p-4" aria-label="Loading notifications">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-khaki/70 motion-reduce:animate-none"
              />
            ))}
          </div>
        )}
        {filteredStatus !== "loading" && visibleEntries.length === 0 && (
          <div className="px-6 py-10 text-center">
            <p className="font-heading font-semibold">You're all caught up</p>
            <p className="mt-1 text-sm text-muted">
              {filter === "unread"
                ? "There are no unread notifications."
                : "New updates will appear here."}
            </p>
          </div>
        )}
        {visibleEntries.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onSelect={selectAndClose}
            compact
          />
        ))}
      </div>

      <Link
        to={feedPath}
        onClick={onClose}
        className="flex min-h-11 items-center justify-center border-t border-khaki px-4 text-sm font-semibold text-primary hover:bg-cream"
      >
        View all notifications
      </Link>
    </section>
  );
}
