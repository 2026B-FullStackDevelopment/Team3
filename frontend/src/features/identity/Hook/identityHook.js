import { useCallback, useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth/useAuth.js'
import { identityService } from '@/features/identity/Service/identityService.js'
import { USER_ROLES, AVATAR_ALLOWED_MIME_TYPES, AVATAR_MAX_BYTES } from '@/config/constants.js'
import { homePathForRole } from '@/shared/utils/routing.js'
import {
  isValidEmail,
  isValidTaxCode,
  isValidCompanyName,
  checkPasswordRules,
} from '@/shared/utils/validators.js'

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
  if (result.ok) return { outcome: 'ok', role: result.data?.user?.role }

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

    const { outcome, message, role } = await classifyLogin(login, {
      email: values.email.trim(),
      password: values.password,
    })

    switch (outcome) {
      case 'ok': {
        const to = location.state?.from ?? homePathForRole(role)
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

/* ---- Register: Recipient ----------------------------------------------------- */

export function useRegisterRecipientForm() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { userName: '', email: '', city: '', password: '', confirmPassword: '' },
  })

  const [emailError, setEmailError] = useState(null)
  const [banner, setBanner] = useState(null)
  const password = useWatch({ control, name: 'password' })

  const onSubmit = handleSubmit(async (values) => {
    setEmailError(null)
    setBanner(null)

    const result = await identityService.register({
      email: values.email.trim(),
      password: values.password,
      role: 'Recipient',
      userName: values.userName.trim(),
      city: values.city,
    })

    if (result.ok) {
      await login({ email: values.email.trim(), password: values.password })
      navigate(homePathForRole(USER_ROLES.RECIPIENT), { replace: true })
      return
    }
    if (result.status === 409) {
      setEmailError(result.error?.message ?? 'This email is already registered')
      return
    }
    setBanner(result.error?.message ?? 'Something went wrong. Please try again.')
  })

  return {
    register,
    errors,
    isSubmitting,
    onSubmit,
    emailError,
    banner,
    password,
    userNameRules: {
      required: 'Username is required.',
      pattern: {
        value: /^[A-Za-z0-9_-]+$/,
        message:
          'Username may contain only English letters, numbers, underscore (_) and hyphen (-) — e.g. jane_doe-01',
      },
    },
    emailRules: {
      required: 'Email is required.',
      validate: (v) =>
        isValidEmail(v) ||
        'Enter a valid email — one “@”, a “.” after it, no spaces or ( ) ; : — e.g. jane.doe@example.com',
    },
    cityRules: { required: 'Please select your city — e.g. Ho Chi Minh City.' },
    passwordRules: {
      required: 'Password is required.',
      validate: (v) =>
        checkPasswordRules(v).length === 0 ||
        'Password needs 8+ characters, a number, a special character and an uppercase letter — e.g. Abcdef1!',
    },
    confirmRules: {
      required: 'Please confirm your password.',
      validate: (v, values) =>
        v === values.password || 'Passwords do not match — re-enter the same password as above.',
    },
  }
}

/* ---- Register: Donor (+ geolocation) ----------------------------------------- */

/** Resolves to [lng, lat]; rejects on denial/unsupported. Not exported. */
function requestGeolocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('unsupported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000 },
    )
  })
}

export function useRegisterDonorForm() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      companyName: '',
      taxCode: '',
      city: '',
      password: '',
      confirmPassword: '',
    },
  })

  const [emailError, setEmailError] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [banner, setBanner] = useState(null)
  const password = useWatch({ control, name: 'password' })

  const onSubmit = handleSubmit(async (values) => {
    setEmailError(null)
    setLocationError(null)
    setBanner(null)

    let coordinates
    try {
      coordinates = await requestGeolocation()
    } catch {
      setLocationError(
        'Location access is required to register as a donor. Please enable it and try again.',
      )
      return
    }

    const result = await identityService.register({
      email: values.email.trim(),
      password: values.password,
      role: 'Donor',
      companyName: values.companyName.trim(),
      taxCode: values.taxCode.trim(),
      city: values.city,
      location: { type: 'Point', coordinates },
    })

    if (result.ok) {
      await login({ email: values.email.trim(), password: values.password })
      navigate(homePathForRole(USER_ROLES.DONOR), { replace: true })
      return
    }
    if (result.status === 409) {
      setEmailError(result.error?.message ?? 'This email is already registered')
      return
    }
    setBanner(result.error?.message ?? 'Something went wrong. Please try again.')
  })

  return {
    register,
    errors,
    isSubmitting,
    onSubmit,
    emailError,
    locationError,
    banner,
    password,
    emailRules: {
      required: 'Email is required.',
      validate: (v) =>
        isValidEmail(v) ||
        'Enter a valid email — one “@”, a “.” after it, no spaces or ( ) ; : — e.g. jane.doe@example.com',
    },
    companyNameRules: {
      required: 'Company name is required.',
      validate: (v) =>
        isValidCompanyName(v) ||
        'Company name may contain letters, numbers, spaces and hyphens only — e.g. Green Valley Foods',
    },
    taxCodeRules: {
      required: 'Tax code is required.',
      validate: (v) => isValidTaxCode(v) || 'Tax Code must be 10–13 digits — e.g. 0312345678.',
    },
    cityRules: { required: 'Please select your city — e.g. Ho Chi Minh City.' },
    passwordRules: {
      required: 'Password is required.',
      validate: (v) =>
        checkPasswordRules(v).length === 0 ||
        'Password needs 8+ characters, a number, a special character and an uppercase letter — e.g. Abcdef1!',
    },
    confirmRules: {
      required: 'Please confirm your password.',
      validate: (v, values) =>
        v === values.password || 'Passwords do not match — re-enter the same password as above.',
    },
  }
}

/* ---- Profile: load ----------------------------------------------------------- */

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true
    identityService.getProfile().then(({ data, ok }) => {
      if (!active) return
      if (ok && data) {
        setProfile(data.profile ?? data)
        setStatus('ready')
      } else {
        setStatus('error')
      }
    })
    return () => {
      active = false
    }
  }, [])

  return { profile, status, setProfile }
}

/* ---- Profile: edit ----------------------------------------------------------- */

export function useEditProfileForm(profile, onSaved) {
  const { refresh } = useAuth()
  const isDonor = profile?.role === USER_ROLES.DONOR

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    values: {
      email: profile?.email ?? '',
      userName: profile?.userName ?? '',
      companyName: profile?.companyName ?? '',
      city: profile?.city ?? '',
      address: profile?.address ?? '',
    },
  })

  const [banner, setBanner] = useState(null)
  const [avatarError, setAvatarError] = useState(null)
  const [file, setFile] = useState(null) // File to upload, 'REMOVE' to clear, or null
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatarUrl ?? null)
  const [fileName, setFileName] = useState(null)

  const onPickFile = (picked) => {
    if (!picked) return
    // Validate on pick (mirrors the backend) — a non-image or oversized file is
    // rejected here so it never gets staged/uploaded.
    if (!AVATAR_ALLOWED_MIME_TYPES.includes(picked.type)) {
      setAvatarError('Please choose a JPEG, PNG or WebP image.')
      return
    }
    if (picked.size > AVATAR_MAX_BYTES) {
      setAvatarError('Image must be 2 MB or smaller.')
      return
    }
    setAvatarError(null)
    setFile(picked)
    setFileName(picked.name)
    setAvatarPreview(URL.createObjectURL(picked))
  }
  const onRemoveAvatar = () => {
    setAvatarError(null)
    setFile('REMOVE')
    setFileName(null)
    setAvatarPreview(null)
  }

  const onSubmit = handleSubmit(async (values) => {
    setBanner(null)
    setAvatarError(null)

    const patch = isDonor
      ? {
          email: values.email.trim(),
          companyName: values.companyName.trim(),
          city: values.city,
          address: values.address.trim(),
        }
      : { email: values.email.trim(), userName: values.userName.trim(), city: values.city }

    const res = await identityService.updateProfile(patch)
    if (!res.ok) {
      setBanner(res.error?.message ?? 'Could not save your changes. Please try again.')
      return
    }
    let updated = res.data.profile ?? res.data

    if (file === 'REMOVE') {
      const r = await identityService.removeAvatar()
      if (!r.ok) {
        setAvatarError(r.error?.message ?? 'Could not remove your photo. Please try again.')
        return
      }
      updated = r.data.profile ?? r.data
    } else if (file) {
      const r = await identityService.uploadAvatar(file)
      if (!r.ok) {
        // Surface the failure (e.g. non-image / too large) instead of silently
        // reporting success.
        setAvatarError(r.error?.message ?? 'Could not upload your photo. Please try again.')
        return
      }
      updated = r.data.profile ?? r.data
    }

    // Re-hydrate the session so the navbar (name + avatar from /api/auth/me)
    // reflects the change — the page uses `updated`, the navbar uses the session.
    await refresh()
    onSaved(updated)
  })

  return {
    register,
    errors,
    isSubmitting,
    onSubmit,
    banner,
    avatarError,
    avatarPreview,
    fileName,
    onPickFile,
    onRemoveAvatar,
    emailRules: {
      required: 'Email is required.',
      validate: (v) =>
        isValidEmail(v) ||
        'Enter a valid email — one “@”, a “.” after it, no spaces or ( ) ; : — e.g. jane.doe@example.com',
    },
    userNameRules: {
      required: 'Username is required.',
      pattern: {
        value: /^[A-Za-z0-9_-]+$/,
        message:
          'Username may contain only English letters, numbers, underscore (_) and hyphen (-) — e.g. jane_doe-01',
      },
    },
    companyNameRules: {
      required: 'Company name is required.',
      validate: (v) =>
        isValidCompanyName(v) ||
        'Company name may contain letters, numbers, spaces and hyphens only — e.g. Green Valley Foods',
    },
    cityRules: { required: 'Please select your city — e.g. Ho Chi Minh City.' },
    addressRules: {},
  }
}

/* ---- Profile: change password (separate; revokes session) -------------------- */

const PASSWORD_REDIRECT_SECONDS = 5

export function useChangePassword() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } })

  const [currentError, setCurrentError] = useState(null)
  const [banner, setBanner] = useState(null)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(PASSWORD_REDIRECT_SECONDS)
  const password = useWatch({ control, name: 'newPassword' })

  const goToLoginNow = useCallback(async () => {
    await logout()
    navigate('/login', { replace: true, state: { passwordChanged: true } })
  }, [logout, navigate])

  // After a successful change, count down then sign out + redirect to /login.
  useEffect(() => {
    if (!success) return undefined
    if (countdown <= 0) {
      goToLoginNow()
      return undefined
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [success, countdown, goToLoginNow])

  const onSubmit = handleSubmit(async (values) => {
    setCurrentError(null)
    setBanner(null)

    const res = await identityService.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    })

    if (res.ok) {
      setSuccess(true) // show the in-modal success + countdown; redirect handled by the effect
      return
    }
    const message = res.error?.message ?? ''
    if (res.status === 401) {
      setCurrentError(message || 'Current password is incorrect.')
      return
    }
    setBanner(message || 'Could not change your password. Please try again.')
  })

  return {
    register,
    errors,
    isSubmitting,
    onSubmit,
    currentError,
    banner,
    success,
    countdown,
    goToLoginNow,
    password,
    passwordRules: {
      required: 'New password is required.',
      validate: (v) =>
        checkPasswordRules(v).length === 0 ||
        'Password needs 8+ characters, a number, a special character and an uppercase letter — e.g. Abcdef1!',
    },
    confirmRules: {
      required: 'Please confirm your new password.',
      validate: (v, values) => v === values.newPassword || 'Passwords do not match.',
    },
  }
}
