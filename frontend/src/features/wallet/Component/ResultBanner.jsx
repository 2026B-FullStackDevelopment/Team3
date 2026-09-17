import { cn } from '@/shared/utils/cn.js'

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
)

const VARIANTS = {
  success: { border: 'border-primary', chip: 'bg-primary-soft text-primary', title: 'text-ink', Icon: CheckIcon },
  info: { border: 'border-primary', chip: 'bg-primary-soft text-primary', title: 'text-ink', Icon: CheckIcon },
  error: { border: 'border-danger', chip: 'bg-danger-soft text-danger', title: 'text-danger', Icon: AlertIcon },
}

/** Wallet-module result banner (success/error/info). Used by deposit + premium. */
export function ResultBanner({ variant = 'success', title, message, children, onDismiss }) {
  const v = VARIANTS[variant] ?? VARIANTS.success
  const { Icon } = v

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('mb-6 flex items-center gap-4 rounded-card border-l-4 bg-surface p-5 shadow-sm', v.border)}
    >
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', v.chip)}>
        <Icon />
      </span>
      <div className="flex-1">
        <p className={cn('font-semibold', v.title)}>{title}</p>
        {message && <p className="text-sm text-muted">{message}</p>}
        {children && <div className="mt-2">{children}</div>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-muted transition-colors hover:text-ink"
        aria-label="Dismiss"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  )
}
