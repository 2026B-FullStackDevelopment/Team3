import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/utils/cn.js'

/**
 * Accessible dialog rendered into a portal: dimmed overlay, Esc-to-close,
 * body-scroll lock, and a focus trap (Tab cycles within; focus is restored to
 * the trigger on close). `title`/`footer` are optional slots; `className`
 * overrides the panel surface (the login caution modal passes a dark variant).
 * Tailwind classes inlined (single-file rule).
 */

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function Modal({ open, title, onClose, footer, className, children }) {
  const panelRef = useRef(null)
  const restoreFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    restoreFocusRef.current = document.activeElement
    const panel = panelRef.current
    const getFocusables = () => Array.from(panel?.querySelectorAll(FOCUSABLE) ?? [])
    ;(getFocusables()[0] ?? panel)?.focus()

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        onClose?.()
        return
      }
      if (e.key !== 'Tab') return
      const nodes = getFocusables()
      if (nodes.length === 0) {
        e.preventDefault()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      restoreFocusRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-md rounded-card bg-surface p-6 shadow-xl focus:outline-none',
          className,
        )}
      >
        {title && <h2 className="text-lg font-bold">{title}</h2>}
        {children}
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
