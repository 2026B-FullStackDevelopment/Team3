import { AlertCircle, CheckCircle2, Info, LoaderCircle, TriangleAlert } from 'lucide-react'
import { cn } from '@/shared/utils/cn.js'

const variants = {
  info: { icon: Info, className: 'border-aff-border bg-aff-panel text-aff-text' },
  loading: { icon: LoaderCircle, className: 'border-aff-border bg-aff-panel text-aff-text' },
  warning: { icon: TriangleAlert, className: 'border-aff-warning bg-aff-warning/45 text-aff-text' },
  danger: { icon: AlertCircle, className: 'border-aff-danger/40 bg-aff-danger/10 text-aff-danger' },
  success: { icon: CheckCircle2, className: 'border-aff-accent/40 bg-aff-accent/10 text-aff-primary' },
}

export function StatusAlert({ variant = 'info', title, children, action, className }) {
  const config = variants[variant] ?? variants.info
  const Icon = config.icon
  const liveRole = variant === 'danger' || variant === 'warning' ? 'alert' : 'status'

  return (
    <div
      role={liveRole}
      className={cn('flex gap-3 rounded-aff border p-4', config.className, className)}
    >
      <Icon
        aria-hidden="true"
        className={cn('mt-0.5 size-5 shrink-0', variant === 'loading' && 'animate-spin motion-reduce:animate-none')}
      />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="mt-1 text-sm opacity-90">{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  )
}

export function EmptyState({ title, children, action, className }) {
  return (
    <section className={cn('empty-state', className)} aria-labelledby="empty-state-title">
      <h2 id="empty-state-title" className="text-lg font-semibold">{title}</h2>
      {children && <div className="mt-2 text-sm text-aff-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </section>
  )
}
