import { useEffect, useRef, useState } from 'react'
import { cn } from '@/shared/utils/cn.js'

/**
 * Green "Profile updated successfully" banner shown after an edit save. It stays
 * for 5s, fades out over ~0.5s, then calls `onDismiss` so the page can drop it.
 */
const VISIBLE_MS = 5000
const FADE_MS = 500

export function ProfileSuccessBanner({ onDismiss }) {
  const [leaving, setLeaving] = useState(false)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    const fade = setTimeout(() => setLeaving(true), VISIBLE_MS)
    const done = setTimeout(() => onDismissRef.current?.(), VISIBLE_MS + FADE_MS)
    return () => {
      clearTimeout(fade)
      clearTimeout(done)
    }
  }, [])

  return (
    <div
      className={cn(
        'mb-6 flex items-center gap-4 rounded-card border-l-4 border-primary bg-surface p-5 shadow-sm transition-opacity duration-500',
        leaving && 'opacity-0',
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </span>
      <div>
        <p className="font-semibold text-ink">Profile updated successfully</p>
        <p className="text-sm text-muted">Your changes have been saved.</p>
      </div>
    </div>
  )
}
