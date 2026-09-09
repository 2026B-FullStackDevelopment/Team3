import { Link } from 'react-router-dom'
import { cn } from '@/shared/utils/cn.js'
import logoUrl from '@/assets/aff-logo.webp'

/**
 * AFF brand lockup: the round AFF icon + the "AFF" wordmark. `tone` switches the
 * wordmark color for dark vs light surfaces. Links to `to` (default home) unless
 * `to={null}` is passed. Tailwind classes inlined.
 */

const sizes = {
  sm: { mark: 'h-7 w-7', word: 'text-lg' },
  md: { mark: 'h-9 w-9', word: 'text-xl' },
  lg: { mark: 'h-11 w-11', word: 'text-2xl' },
}

// Wordmark color adapts to the surface it sits on.
const wordTone = {
  dark: 'text-ink', // on light/cream surfaces
  light: 'text-white', // on the dark hero / olive panels
}

export function Brand({ size = 'md', tone = 'dark', to = '/', className }) {
  const s = sizes[size]

  const inner = (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <img src={logoUrl} alt="AFF logo" className={cn('object-contain', s.mark)} />
      <span className={cn('font-heading font-bold tracking-tight', s.word, wordTone[tone])}>
        AFF
      </span>
    </span>
  )

  if (to === null) return inner

  return (
    <Link to={to} className="inline-flex w-fit" aria-label="AFF home">
      {inner}
    </Link>
  )
}
