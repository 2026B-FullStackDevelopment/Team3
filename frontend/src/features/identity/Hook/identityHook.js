import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth/useAuth.js'
import { isValidEmail } from '@/shared/utils/validators.js'

/**
 * Identity module hooks (all of them — one hook file per module, FE_ARCHITECTURE F11).
 * Presentational and behavioral hooks for the identity screens live here.
 */

/* ---- Landing hero carousel (presentational) --------------------------------- */

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

/* ---- Login ------------------------------------------------------------------- */

/**
 * Runs the login through AuthProvider.login() (the sanctioned Service caller that
 * also refreshes the session) and classifies the normalized result into a UI
 * outcome. Not exported — internal to useLoginForm.
 * Backend contract: 401 "Invalid email or password" (invalid), 401 "…locked…"
 * (locked), 403 "This account has been deactivated" (deactivated).
 */
async function classifyLogin(login, credentials) {
  const result = await login(credentials)
  if (result.ok) return { outcome: 'ok' }

  const message = result.error?.message ?? result.data?.message ?? ''
  if (result.status === 401 && /lock/i.test(message)) return { outcome: 'locked', message }
  if (result.status === 401) {
    return { outcome: 'invalid', message: message || 'Invalid email or password' }
  }
  if (result.status === 403) {
    return { outcome: 'deactivated', message: message || 'This account has been deactivated' }
  }
  return { outcome: 'error', message: 'Something went wrong. Please try again.' }
}

export function useLoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } })

  const [banner, setBanner] = useState(null)
  const [credentialError, setCredentialError] = useState(null)
  const [lock, setLock] = useState(null)
  const [showLockModal, setShowLockModal] = useState(false)

  const onSubmit = handleSubmit(async (values) => {
    setBanner(null)
    setCredentialError(null)

    const { outcome, message } = await classifyLogin(login, {
      email: values.email.trim(),
      password: values.password,
    })

    switch (outcome) {
      case 'ok': {
        const to = location.state?.from ?? '/profile'
        navigate(to, { replace: true })
        return
      }
      case 'invalid':
        setCredentialError(message)
        return
      case 'locked':
        setLock({ message })
        setShowLockModal(true)
        return
      case 'deactivated':
      case 'error':
      default:
        setBanner(message)
    }
  })

  return {
    register,
    errors,
    isSubmitting,
    onSubmit,
    banner,
    credentialError,
    lock,
    showLockModal,
    dismissLockModal: () => setShowLockModal(false),
    clearLock: () => {
      setLock(null)
      setShowLockModal(false)
    },
    emailRules: {
      required: 'Email is required',
      validate: (v) => isValidEmail(v) || 'Enter a valid email address',
    },
    passwordRules: { required: 'Password is required' },
  }
}
