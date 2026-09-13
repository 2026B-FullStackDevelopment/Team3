import { useCallback, useEffect, useRef, useState } from 'react'
import soldOutSound from '@/assets/sounds/listing-sold-out.wav'

const SOUND_PREFERENCE_KEY = 'aff-notification-sound-enabled'
const DELIVERY_KEY_PREFIX = 'aff-notification-sound:'
const DELIVERY_TTL_MS = 10_000

export function useNotificationSound() {
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem(SOUND_PREFERENCE_KEY) !== 'false',
  )
  const [blocked, setBlocked] = useState(false)
  const audioRef = useRef(null)
  const playedIds = useRef(new Set())

  useEffect(() => {
    audioRef.current = new Audio(soldOutSound)
    audioRef.current.preload = 'auto'
    audioRef.current.volume = 0.6
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    let unlocked = false
    const unlock = async () => {
      if (unlocked || !audioRef.current) return
      const audio = audioRef.current
      audio.muted = true
      try {
        await audio.play()
        audio.pause()
        audio.currentTime = 0
        unlocked = true
        setBlocked(false)
        window.removeEventListener('pointerdown', unlock)
        window.removeEventListener('keydown', unlock)
      } catch {
        // A future user gesture can still enable media playback.
      } finally {
        audio.muted = false
      }
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const toggle = useCallback(() => {
    setEnabled((current) => {
      const next = !current
      localStorage.setItem(SOUND_PREFERENCE_KEY, String(next))
      if (next) setBlocked(false)
      return next
    })
  }, [])

  const enable = useCallback(async () => {
    setEnabled(true)
    localStorage.setItem(SOUND_PREFERENCE_KEY, 'true')
    try {
      if (!audioRef.current) return false
      audioRef.current.currentTime = 0
      await audioRef.current.play()
      setBlocked(false)
      return true
    } catch {
      setBlocked(true)
      return false
    }
  }, [])

  const play = useCallback(
    async (notificationId) => {
      const id = String(notificationId)
      if (!enabled || playedIds.current.has(id)) return false
      playedIds.current.add(id)

      const deliveryKey = `${DELIVERY_KEY_PREFIX}${id}`
      const lastDelivery = Number(localStorage.getItem(deliveryKey))
      if (Number.isFinite(lastDelivery) && Date.now() - lastDelivery < DELIVERY_TTL_MS) {
        return false
      }
      localStorage.setItem(deliveryKey, String(Date.now()))
      window.setTimeout(() => {
        const marker = Number(localStorage.getItem(deliveryKey))
        if (Number.isFinite(marker) && Date.now() - marker >= DELIVERY_TTL_MS) {
          localStorage.removeItem(deliveryKey)
        }
      }, DELIVERY_TTL_MS)

      try {
        const audio = audioRef.current
        if (!audio) return false
        audio.currentTime = 0
        await audio.play()
        setBlocked(false)
        return true
      } catch {
        setBlocked(true)
        return false
      }
    },
    [enabled],
  )

  const stop = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
  }, [])

  return { enabled, blocked, enable, play, stop, toggle }
}
