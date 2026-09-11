import { useCallback, useEffect, useState } from 'react'

/**
 * Marketing (public Landing) hooks. Presentational only.
 */

/* ---- Landing hero carousel --------------------------------------------------- */

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
