import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { notificationContent } from "@/features/notification/Model/notificationModel.js";

export function NotificationToast({ notification, onDismiss }) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [notification, onDismiss]);

  const defaultContent = notification
    ? notificationContent(notification.type)
    : null;
  const content = notification
    ? {
        title: notification.title ?? defaultContent.title,
        message: notification.message ?? defaultContent.message,
      }
    : null;

  return (
    <AnimatePresence>
      {notification && (
        <motion.aside
          key={notification.id}
          role="status"
          aria-live="polite"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          className="fixed right-4 top-20 z-50 w-[calc(100%-2rem)] max-w-sm rounded-card border border-khaki-strong bg-surface p-4 text-ink shadow-xl"
        >
          <div className="flex items-start gap-3">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-white"
              aria-hidden="true"
            >
              ✓
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-semibold">
                {content.title}
              </p>
              <p className="mt-1 text-sm text-muted">{content.message}</p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-cream"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
