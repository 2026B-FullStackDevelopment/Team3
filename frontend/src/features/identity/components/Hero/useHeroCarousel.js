import { useCallback, useEffect, useState } from 'react'

/**
 * Behavior for the landing hero image carousel: holds the active slide index and
 * auto-advances to the next slide every `intervalMs` (default 7s). Selecting a
 * slide manually resets the timer so it doesn't jump immediately after.
 */
export function useHeroCarousel(count, intervalMs = 7000) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (count <= 1) return undefined
    const id = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs)
    return () => clearInterval(id)
  }, [count, intervalMs, index])

  const goTo = useCallback((i) => setIndex(i), [])

  return { index, goTo }
}
