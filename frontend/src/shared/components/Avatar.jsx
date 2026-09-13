import { cn } from '@/shared/utils/cn.js'

/**
 * Round avatar: shows the image at `src` when present, otherwise a neutral
 * "anonymous" silhouette (Facebook-style default). Presentation only.
 */

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
}

export function Avatar({ src, size = 'md', className }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={cn('shrink-0 rounded-full object-cover', sizes[size], className)}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-khaki-strong text-white',
        sizes[size],
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[72%] w-[72%]" aria-hidden="true">
        <circle cx="12" cy="8.5" r="3.75" />
        <path d="M4.5 20c0-3.9 3.4-5.9 7.5-5.9s7.5 2 7.5 5.9v.5h-15z" />
      </svg>
    </span>
  )
}
