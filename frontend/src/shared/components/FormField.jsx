import { cn } from '@/shared/utils/cn.js'

/**
 * Labelled form-control wrapper. Owns the label (+ required `*`), and shows a red
 * error message (with the `!` badge from the sketch) when `error` is set, else the
 * muted hint. Any control is passed as `children` (Input, PasswordInput, Select…).
 * Tailwind classes inlined (single-file rule).
 */
export function FormField({ label, htmlFor, required, error, hint, className, children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}

      {children}

      {error ? (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <span
            aria-hidden="true"
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white"
          >
            !
          </span>
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
