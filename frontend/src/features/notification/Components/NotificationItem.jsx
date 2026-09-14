import { cn } from '@/shared/utils/cn.js'
import {
  formatNotificationTime,
  notificationContent,
} from '@/features/notification/Model/notificationModel.js'

const ICONS = {
  match: <path d="m12 3 2.5 5.3L20 9l-4 3.9.9 5.5L12 15.8 7.1 18.4 8 12.9 4 9l5.5-.7L12 3Z" />,
  soldOut: <><path d="M4 7h16v12H4z" /><path d="M8 7V5h8v2M8 12l2.5 2.5L16 9" /></>,
  cancelled: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
}

export function NotificationItem({ notification, onSelect, compact = false }) {
  const content = notificationContent(notification.type)

  return (
    <button
      type="button"
      onClick={() => onSelect?.(notification.id)}
      className={cn(
        'relative flex w-full gap-3 border-b border-khaki/70 px-4 text-left transition-colors last:border-b-0',
        compact ? 'py-3' : 'py-4',
        notification.isRead ? 'bg-surface hover:bg-cream/60' : 'bg-primary-soft/70 hover:bg-primary-soft',
      )}
      aria-label={`${notification.isRead ? 'Read' : 'Unread'}: ${content.title}`}
    >
      {!notification.isRead && (
        <span className="absolute left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" aria-hidden="true" />
      )}
      <span className={cn('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full', notification.isRead ? 'bg-khaki text-muted' : 'bg-primary text-white')}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {ICONS[content.icon]}
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-sm', notification.isRead ? 'font-medium' : 'font-semibold')}>{content.title}</span>
        <span className="mt-0.5 block text-sm text-muted">{content.message}</span>
        <span className="mt-1 block text-xs text-muted">{formatNotificationTime(notification.createdAt)}</span>
      </span>
    </button>
  )
}
