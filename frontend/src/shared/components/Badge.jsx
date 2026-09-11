import { cn } from '@/shared/utils/cn.js'

/** Small status pill. Presentation only. */
const variants = {
  neutral: 'bg-black/5 text-ink',
  success: 'bg-primary-soft text-primary',
  khaki: 'bg-khaki text-ink',
  danger: 'bg-danger-soft text-danger',
}

export function Badge({ variant = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
