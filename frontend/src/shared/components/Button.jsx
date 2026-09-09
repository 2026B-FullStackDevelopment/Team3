import { Link } from 'react-router-dom'
import { cn } from '@/shared/utils/cn.js'

/**
 * Reusable button primitive (presentation only — no hook, no service calls).
 * Renders a react-router <Link> when `to` is set, an <a> when `href` is set,
 * otherwise a native <button>. Tailwind classes are inlined (single-file rule).
 */

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold ' +
  'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'border border-khaki-strong bg-surface text-ink hover:bg-khaki',
  ghost: 'text-ink hover:bg-black/5',
  danger: 'bg-danger text-white hover:opacity-90',
}

const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-12 px-7 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  to,
  href,
  loading = false,
  leftIcon,
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}) {
  const classes = cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)

  const content = (
    <>
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        leftIcon
      )}
      {children}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    )
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  )
}
