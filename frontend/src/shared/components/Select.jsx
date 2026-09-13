import { cn } from '@/shared/utils/cn.js'

/**
 * Native select control (presentation only). Label/error text is owned by
 * FormField. `error` (any truthy) switches to the red-ring state; a leading
 * disabled placeholder option shows when the bound value is "". Remaining props
 * (incl. the react-hook-form register spread) pass to <select>. Tailwind inlined.
 */

const base =
  'h-12 w-full appearance-none rounded-xl border bg-surface px-4 pr-10 text-sm text-ink ' +
  'transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60'
const normal = 'border-khaki-strong focus:border-primary focus:ring-primary/30'
const errored = 'border-danger bg-danger-soft/50 focus:border-danger focus:ring-danger/30'

export function Select({ options = [], placeholder, error, className, ...props }) {
  return (
    <div className="relative">
      <select
        aria-invalid={error ? true : undefined}
        className={cn(base, error ? errored : normal, className)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => {
          const value = typeof o === 'string' ? o : o.value
          const label = typeof o === 'string' ? o : o.label
          return (
            <option key={value} value={value}>
              {label}
            </option>
          )
        })}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}
