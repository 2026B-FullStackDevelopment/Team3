import { Input } from '@/shared/components/Input.jsx'
import { usePasswordInput } from './usePasswordInput.js'

/**
 * Password field: an Input whose type flips between password/text via the eye
 * toggle in the rightIcon slot. All other props (placeholder, error, and the
 * react-hook-form register spread) pass through to Input. Tailwind classes
 * inlined (single-file rule).
 */

function EyeIcon({ off }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
  )
}

export function PasswordInput({ error, ...props }) {
  const { visible, toggle } = usePasswordInput()

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      error={error}
      rightIcon={
        <button
          type="button"
          onClick={toggle}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="flex items-center text-muted transition-colors hover:text-ink"
        >
          <EyeIcon off={visible} />
        </button>
      }
    />
  )
}
