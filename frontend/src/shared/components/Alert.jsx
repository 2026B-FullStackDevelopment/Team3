import { cn } from '@/shared/utils/cn.js'

/**
 * Inline message block for form-level feedback (e.g. deactivated account,
 * "email already registered"). Presentation only. Tailwind classes inlined.
 */

const variants = {
  error: 'border-danger/30 bg-danger-soft text-danger',
  success: 'border-primary/30 bg-primary-soft text-primary',
  warning: 'border-khaki-strong bg-khaki text-ink',
}

export function Alert({ variant = 'error', className, children }) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-xl border px-4 py-3 text-sm leading-snug',
        variants[variant],
        className,
      )}
    >
      {children}
    </div>
  )
}
