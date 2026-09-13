import { useEffect, useRef, useState } from 'react'
import { NotificationBell } from '@/shared/components/ui/notification-bell.jsx'
import { NotificationPanel } from '@/features/notification/Component/NotificationPanel.jsx'
import { useNotifications } from '@/features/notification/Hook/useNotifications.js'

export function NotificationBellTrigger() {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const { unreadCount } = useNotifications()

  useEffect(() => {
    if (!open) return undefined
    panelRef.current?.focus()

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={wrapperRef} className="relative">
      <NotificationBell
        ref={triggerRef}
        count={unreadCount}
        max={99}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      />
      {open && <NotificationPanel panelRef={panelRef} onClose={() => setOpen(false)} />}
    </div>
  )
}
