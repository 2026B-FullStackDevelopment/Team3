import { cn } from '@/shared/utils/cn.js'

/**
 * Text input control (presentation only). The label/hint/error *text* is owned
 * by FormField — this renders just the field so the two compose without a double
 * label. `error` (any truthy) switches to the red-ring / pink-fill state from the
 * sketch; `rightIcon` is an absolutely-positioned slot (used by PasswordInput's
 * eye toggle). Remaining props (incl. react-hook-form's register spread) pass
 * straight to the native <input>. Tailwind classes inlined (single-file rule).
 */

const base =
  'h-12 w-full rounded-xl border bg-surface px-4 text-sm text-ink placeholder:text-muted/70 ' +
  'transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60'

const normal = 'border-khaki-strong focus:border-primary focus:ring-primary/30'
const errored = 'border-danger bg-danger-soft/50 focus:border-danger focus:ring-danger/30'

export function Input({ error, rightIcon, className, type = 'text', ...props }) {
  return (
    <div className="relative">
      <input
        type={type}
        aria-invalid={error ? true : undefined}
        className={cn(base, error ? errored : normal, rightIcon && 'pr-11', className)}
        {...props}
      />
      {rightIcon && (
        <span className="absolute inset-y-0 right-3 flex items-center">{rightIcon}</span>
      )}
    </div>
  )
}
