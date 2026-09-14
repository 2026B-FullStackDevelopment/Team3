import { cn } from '@/shared/utils/cn.js'

/** Multi-line text control, styled to match Input.jsx. Presentation only. */

const base =
  'w-full rounded-xl border bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/70 ' +
  'transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 resize-none'

const normal = 'border-khaki-strong focus:border-primary focus:ring-primary/30'
const errored = 'border-danger bg-danger-soft/50 focus:border-danger focus:ring-danger/30'

export function Textarea({ error, className, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      aria-invalid={error ? true : undefined}
      className={cn(base, error ? errored : normal, className)}
      {...props}
    />
  )
}
