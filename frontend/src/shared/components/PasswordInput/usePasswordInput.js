import { useCallback, useState } from 'react'

/** Behavior for PasswordInput: tracks whether the value is revealed as plain text. */
export function usePasswordInput() {
  const [visible, setVisible] = useState(false)
  const toggle = useCallback(() => setVisible((v) => !v), [])
  return { visible, toggle }
}
