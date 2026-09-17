import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/auth/useAuth.js'
import { walletService } from '@/features/wallet/Service/walletService.js'
import { premiumService } from '@/features/wallet/Service/premiumService.js'
import { formatSubscription } from '@/features/wallet/Model/premiumModel.js'
import { PREMIUM_PRICE_VND } from '@/config/constants.js'
import { formatVnd } from '@/shared/utils/formatters.js'

/**
 * Premium checkout hook (Wallet module). Loads the wallet balance + subscription
 * status, and buys premium (charging the wallet). Refreshes the session on success
 * so the navbar/profile reflect premium immediately.
 */
/** Derive an initial result banner from ?status= query param (set before first render). */
function initialResultFromSearch(searchParams) {
  const stripeStatus = searchParams.get('status')
  if (stripeStatus === 'cancel') {
    return { variant: 'info', title: 'Payment canceled', message: 'No charge was made.' }
  }
  if (stripeStatus === 'success') {
    return {
      variant: 'info',
      title: 'Confirming your payment…',
      message: "We're still confirming your payment. Please wait a moment.",
    }
  }
  return null
}

export function usePremium() {
  const { refresh } = useAuth()
  const [searchParams] = useSearchParams()
  const [balance, setBalance] = useState(0)
  const [subscription, setSubscription] = useState({ isPremium: false, expiryDate: null })
  const [status, setStatus] = useState('loading')
  const [result, setResult] = useState(() => initialResultFromSearch(searchParams))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCardSubmitting, setIsCardSubmitting] = useState(false)

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

  // After data loads: if returning from a successful Stripe payment, re-fetch status
  // and upgrade the banner if premium is now active.
  useEffect(() => {
    if (status !== 'ready' || searchParams.get('status') !== 'success') return
    let active = true
    premiumService.getStatus().then((statusRes) => {
      if (!active || !statusRes.ok) return
      const sub = formatSubscription(statusRes.data)
      setSubscription(sub)
      refresh()
      if (sub.isPremium) {
        setResult({
          variant: 'success',
          title: "You're now a Premium member!",
          message: 'Your card payment was confirmed — benefits are active immediately.',
        })
      }
    })
    return () => {
      active = false
    }
  }, [status, searchParams, refresh])

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
        message: `Payment of ${formatVnd(PREMIUM_PRICE_VND)} confirmed — your benefits are active immediately.`,
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

  const subscribeWithCard = useCallback(async () => {
    setResult(null)
    setIsCardSubmitting(true)
    const res = await premiumService.subscribeWithCard()

    if (res.ok) {
      window.location.href = res.data.url
      // do not clear isCardSubmitting — we're navigating away
      return
    }
    setIsCardSubmitting(false)
    if (res.status === 409) {
      // 409 covers both "already premium" and "card payment not available"
      // (Stripe not configured) — lean on the server message, keep the title neutral.
      setResult({
        variant: 'info',
        title: "Can't start card payment",
        message: res.error?.message ?? "Card payment isn't available right now.",
      })
      return
    }
    setResult({
      variant: 'error',
      title: "Couldn't start card payment",
      message: 'Something went wrong on our end. Please try again.',
    })
  }, [])

  return {
    balance,
    subscription,
    status,
    canAfford: balance >= PREMIUM_PRICE_VND,
    priceVnd: PREMIUM_PRICE_VND,
    result,
    isSubmitting,
    isCardSubmitting,
    subscribe,
    subscribeWithCard,
    dismissResult: () => setResult(null),
  }
}
