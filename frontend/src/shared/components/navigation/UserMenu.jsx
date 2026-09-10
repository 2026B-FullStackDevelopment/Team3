import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/utils/cn.js'
import { Avatar } from '@/shared/components/Avatar.jsx'

/**
 * Avatar + name button that opens a small account dropdown (Profile, Log out).
 * Presentation only — `user`, `home` and `onLogout` are injected. `tone` adapts
 * the trigger colors for the dark hero vs a light surface. Closes on outside
 * click, Escape, or selecting an item. Tailwind inlined.
 */
export function UserMenu({ user, home = '/', onLogout, tone = 'dark' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const label = user?.displayName || user?.email || 'Account'

  useEffect(() => {
    if (!open) return undefined
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Hover/active polish: the whole avatar+name is a pill that lights up, the
  // avatar picks up a ring, and the chevron rotates when the menu is open.
  const toneCls =
    tone === 'light'
      ? cn('text-white/90 hover:bg-white/10 hover:text-white', open && 'bg-white/15 text-white')
      : cn('text-ink hover:bg-black/5', open && 'bg-black/5')
  const ringCls = tone === 'light' ? 'group-hover:ring-white/40' : 'group-hover:ring-primary/30'
  const ringOpen = open ? (tone === 'light' ? 'ring-white/40' : 'ring-primary/30') : 'ring-transparent'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'group flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium transition-colors',
          toneCls,
        )}
      >
        <Avatar
          src={user?.avatarUrl}
          size="sm"
          className={cn('ring-2 transition-[box-shadow]', ringOpen, ringCls)}
        />
        <span className="hidden max-w-[12rem] truncate sm:block">{label}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn('transition-transform', open && 'rotate-180')}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-xl border border-khaki-strong/60 bg-surface py-1 text-ink shadow-xl"
        >
          <Link
            to={home}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-black/5"
          >
            Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout?.()
            }}
            className="block w-full px-4 py-2 text-left text-sm text-danger hover:bg-danger-soft"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
