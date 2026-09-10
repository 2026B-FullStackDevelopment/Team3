import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/shared/utils/cn.js'
import { Avatar } from '@/shared/components/Avatar.jsx'

/**
 * Avatar + name button that opens the account dropdown. Presentation only —
 * `user`, `items` (per role) and `onLogout` are injected. Each item is
 * `{ label, to, icon }`; the current route is highlighted; a divider precedes
 * the red Log Out. `tone` adapts the trigger for the dark hero vs a light
 * surface. Closes on outside click, Escape, or selecting an item. Tailwind inlined.
 */

const ICONS = {
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  ),
  wallet: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14.5" r="1" />
    </svg>
  ),
  bell: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
}

export function UserMenu({ user, items = [], onLogout, tone = 'dark' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { pathname } = useLocation()
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

  // Hover/active polish: pill background + avatar ring + chevron rotate.
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
          className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-khaki-strong/60 bg-surface py-1 text-ink shadow-xl"
        >
          {items.map((item) => {
            const active = pathname === item.to
            return (
              <Link
                key={item.label}
                to={item.to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5',
                  active && 'bg-primary-soft font-semibold text-primary',
                )}
              >
                <span className="text-current">{ICONS[item.icon]}</span>
                {item.label}
              </Link>
            )
          })}
          <div className="my-1 border-t border-khaki-strong/50" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout?.()
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-danger hover:bg-danger-soft"
          >
            <span>{ICONS.logout}</span>
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}
