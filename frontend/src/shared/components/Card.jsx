import { cn } from '@/shared/utils/cn.js'

/** White rounded surface used across pages. Presentation only. */
export function Card({ className, children }) {
  return (
    <div className={cn('rounded-card border border-khaki-strong/40 bg-surface p-6 md:p-8', className)}>
      {children}
    </div>
  )
}
