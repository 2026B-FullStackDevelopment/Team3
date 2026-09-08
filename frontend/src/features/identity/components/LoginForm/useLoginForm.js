import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth.js'
import { isValidEmail } from '@/shared/utils/validators.js'
import { submitLogin } from './LoginForm.api.js'

/**
 * Behavior for LoginForm. Owns field state/validation (react-hook-form), runs
 * the login through the api seam, and maps the outcome to UI:
 *   ok          → redirect to the guarded `from` (or /profile)
 *   invalid     → inline error under the password field
 *   locked      → caution modal + inline "Authentication Locked" panel (D3)
 *   deactivated → banner alert (403)
 *   error       → banner alert (network / unexpected)
 * Login is email-only (D1). No live lockout countdown — message-driven MVP (D3).
 */
export function useLoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } })

  // Server-driven feedback, kept out of react-hook-form's field errors.
  const [banner, setBanner] = useState(null) // deactivated / unexpected
  const [credentialError, setCredentialError] = useState(null) // invalid creds (under password)
  const [lock, setLock] = useState(null) // { message } when authentication is locked
  const [showLockModal, setShowLockModal] = useState(false)

  const onSubmit = handleSubmit(async (values) => {
    setBanner(null)
    setCredentialError(null)

    const { outcome, message } = await submitLogin(login, {
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
    // server feedback
    banner,
    credentialError,
    lock,
    showLockModal,
    dismissLockModal: () => setShowLockModal(false),
    clearLock: () => {
      setLock(null)
      setShowLockModal(false)
    },
    // validation rules (shared with backend)
    emailRules: {
      required: 'Email is required',
      validate: (v) => isValidEmail(v) || 'Enter a valid email address',
    },
    passwordRules: { required: 'Password is required' },
  }
}
