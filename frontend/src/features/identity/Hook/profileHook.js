import { useCallback, useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth/useAuth.js'
import { profileService } from '@/features/identity/Service/profileService.js'
import { formatProfile } from '@/features/identity/Model/profileModel.js'
import { USER_ROLES, AVATAR_ALLOWED_MIME_TYPES, AVATAR_MAX_BYTES } from '@/config/constants.js'
import { isValidEmail, isValidCompanyName, checkPasswordRules } from '@/shared/utils/validators.js'

/**
 * Identity/profile hooks (one hook file per sub-domain, FE_ARCHITECTURE F11).
 */

/* ---- Profile: load ----------------------------------------------------------- */

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true
    profileService.getProfile().then(({ data, ok }) => {
      if (!active) return
      if (ok && data) {
        setProfile(formatProfile(data))
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

    const res = await profileService.updateProfile(patch)
    if (!res.ok) {
      setBanner(res.error?.message ?? 'Could not save your changes. Please try again.')
      return
    }
    let updated = formatProfile(res.data)

    if (file === 'REMOVE') {
      const r = await profileService.removeAvatar()
      if (!r.ok) {
        setAvatarError(r.error?.message ?? 'Could not remove your photo. Please try again.')
        return
      }
      updated = formatProfile(r.data)
    } else if (file) {
      const r = await profileService.uploadAvatar(file)
      if (!r.ok) {
        // Surface the failure (e.g. non-image / too large) instead of silently
        // reporting success.
        setAvatarError(r.error?.message ?? 'Could not upload your photo. Please try again.')
        return
      }
      updated = formatProfile(r.data)
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

    const res = await profileService.changePassword({
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
