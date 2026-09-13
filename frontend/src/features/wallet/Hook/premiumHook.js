import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/auth/useAuth.js'
import { walletService } from '@/features/wallet/Service/walletService.js'
import { premiumService } from '@/features/wallet/Service/premiumService.js'
import { formatSubscription } from '@/features/wallet/Model/premiumModel.js'
import { PREMIUM_PRICE_VND } from '@/config/constants.js'
import { formatVND } from '@/shared/utils/format.js'

/**
 * Premium checkout hook (Wallet module). Loads the wallet balance + subscription
 * status, and buys premium (charging the wallet). Refreshes the session on success
 * so the navbar/profile reflect premium immediately.
 */
export function usePremium() {
  const { refresh } = useAuth()
  const [balance, setBalance] = useState(0)
  const [subscription, setSubscription] = useState({ isPremium: false, expiryDate: null })
  const [status, setStatus] = useState('loading')
  const [result, setResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([walletService.getWallet(), premiumService.getStatus()]).then(
      ([walletRes, statusRes]) => {
        if (!active) return
        if (walletRes.ok && statusRes.ok) {
          setBalance(walletRes.data.wallet.balance)
          setSubscription(formatSubscription(statusRes.data))
          setStatus('ready')
        } else {
          setStatus('error')
        }
      },
    )
    return () => {
      active = false
    }
  }, [])

  const subscribe = useCallback(async () => {
    setResult(null)
    setIsSubmitting(true)
    const res = await premiumService.subscribe()
    setIsSubmitting(false)

    if (res.ok) {
      setSubscription(formatSubscription(res.data))
      setResult({
        variant: 'success',
        title: "You're now a Premium member!",
        message: `Payment of ${formatVND(PREMIUM_PRICE_VND)} confirmed — your benefits are active immediately.`,
      })
      await refresh()
      return
    }
    if (res.status === 409) {
      setSubscription((prev) => ({ ...prev, isPremium: true }))
      setResult({
        variant: 'info',
        title: 'You already have Premium',
        message: 'Your subscription is already active.',
      })
      return
    }
    if (res.status === 400) {
      setResult({
        variant: 'error',
        title: "Couldn't upgrade",
        message: res.error?.message ?? 'Insufficient wallet balance.',
      })
      return
    }
    setResult({
      variant: 'error',
      title: "Couldn't upgrade",
      message: 'Something went wrong on our end. No charge was made. Please try again.',
    })
  }, [refresh])

  return {
    balance,
    subscription,
    status,
    canAfford: balance >= PREMIUM_PRICE_VND,
    priceVnd: PREMIUM_PRICE_VND,
    result,
    isSubmitting,
    subscribe,
    dismissResult: () => setResult(null),
  }
}
