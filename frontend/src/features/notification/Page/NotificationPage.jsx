import { Button } from "@/shared/components/Button.jsx";
import { cn } from "@/shared/utils/cn.js";
import { NotificationItem } from "@/features/notification/Components/NotificationItem.jsx";
import { useNotificationFilter } from "@/features/notification/Hook/useNotificationFilter.js";
import { useNotifications } from "@/features/notification/Hook/useNotifications.js";

export function NotificationPage() {
  const {
    entries,
    unreadEntries,
    unreadCount,
    unreadStatus,
    total,
    status,
    error,
    hasMore,
    hasMoreUnread,
    selectNotification,
    markAllRead,
    loadMore,
    loadUnread,
    loadMoreUnread,
    refresh,
  } = useNotifications();

  const { filter, setFilter, visibleEntries } = useNotificationFilter(
    entries,
    unreadEntries,
  );
  const selectFilter = (value) => {
    setFilter(value);
    if (value === "unread") loadUnread();
  };
  const filteredStatus = filter === "unread" ? unreadStatus : status;
  const filteredHasMore = filter === "unread" ? hasMoreUnread : hasMore;
  const loadMoreFiltered =
    filter === "unread" ? loadMoreUnread : loadMore;
  const refreshFiltered = filter === "unread" ? loadUnread : refresh;

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Account updates
          </p>
          <h1 className="mt-1 font-heading text-3xl font-semibold">
            Notifications
          </h1>
          <p className="mt-2 text-sm text-muted">
            {unreadCount} unread · {total} total
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={markAllRead}
          disabled={unreadCount === 0}
        >
          Mark all read
        </Button>
      </div>

      <div className="overflow-hidden rounded-card border border-khaki-strong bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-khaki px-4 py-2">
          <div className="flex gap-1">
            {["all", "unread"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => selectFilter(value)}
                aria-pressed={filter === value}
                className={cn(
                  "min-h-11 rounded-full px-4 text-sm font-medium capitalize",
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
            onClick={refreshFiltered}
            className="min-h-11 px-2 text-sm font-semibold text-primary hover:text-primary-hover"
          >
            Refresh
          </button>
        </div>

        {error && (
          <p className="border-b border-khaki bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        {filteredStatus === "loading" && visibleEntries.length === 0 && (
          <p className="px-6 py-12 text-center text-muted">
            Loading notifications…
          </p>
        )}
        {filteredStatus !== "loading" && visibleEntries.length === 0 && (
          <div className="px-6 py-14 text-center">
            <p className="font-heading text-lg font-semibold">
              You're all caught up
            </p>
            <p className="mt-1 text-sm text-muted">
              {filter === "unread"
                ? "There are no unread notifications."
                : "New account updates will appear here."}
            </p>
          </div>
        )}
        {visibleEntries.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onSelect={selectNotification}
          />
        ))}

        {filteredHasMore && (
          <div className="flex justify-center border-t border-khaki p-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadMoreFiltered}
              loading={filteredStatus === "loading"}
            >
              Load older notifications
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
