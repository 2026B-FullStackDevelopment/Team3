import { useCallback, useState } from 'react'

/** Local open/close state for a Modal. Pair as: open={isOpen} onClose={close}. */
export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])
  return { isOpen, open, close, toggle }
}
