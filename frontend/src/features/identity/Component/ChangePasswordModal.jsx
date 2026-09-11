import { Modal } from '@/shared/components/Modal/Modal.jsx'
import { useModal } from '@/shared/components/Modal/useModal.js'
import { Button } from '@/shared/components/Button.jsx'
import { PasswordInput } from '@/shared/components/PasswordInput/PasswordInput.jsx'
import { FormField } from '@/shared/components/FormField.jsx'
import { Alert } from '@/shared/components/Alert.jsx'
import { useChangePassword } from '@/features/identity/Hook/profileHook.js'
import { PasswordRulesChecklist } from '@/features/identity/Component/PasswordRulesChecklist.jsx'

/**
 * "Change password" trigger + modal. On success the backend revokes the session,
 * so useChangePassword logs out and redirects to /login. Behavior in the hook.
 */
export function ChangePasswordModal() {
  const { isOpen, open, close } = useModal()
  const f = useChangePassword()

  // The modal is portaled to <body>, but React events bubble through the React
  // tree — so this form's submit would otherwise also fire the surrounding Edit
  // Profile form's onSubmit. Stop it here so only the password change runs.
  const handleSubmit = (e) => {
    e.stopPropagation()
    f.onSubmit(e)
  }

  return (
    <>
      <Button variant="secondary" size="md" onClick={open}>
        Change password
      </Button>

      <Modal
        open={isOpen}
        onClose={f.success ? undefined : close}
        title={f.success ? 'Password updated' : 'Change password'}
        footer={
          f.success ? (
            <Button fullWidth size="md" onClick={f.goToLoginNow}>
              Go to log in now
            </Button>
          ) : (
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="md" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" form="change-password-form" size="md" loading={f.isSubmitting}>
                Update password
              </Button>
            </div>
          )
        }
      >
        {f.success ? (
          <div className="py-2 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <h3 className="mt-4 font-heading text-lg font-bold text-ink">
              Password updated successfully
            </h3>
            <p className="mt-2 text-sm text-muted">
              For your security you&rsquo;ll be signed out. Redirecting to log in in{' '}
              <span className="font-semibold text-ink">{f.countdown}s</span>…
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">
              You&rsquo;ll be signed out and asked to log in again after changing your password.
            </p>
            <form id="change-password-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          {f.banner && <Alert variant="error">{f.banner}</Alert>}

          <FormField
            label="Current password"
            htmlFor="currentPassword"
            error={f.errors.currentPassword?.message || f.currentError}
          >
            <PasswordInput
              id="currentPassword"
              autoComplete="current-password"
              error={!!f.errors.currentPassword || !!f.currentError}
              {...f.register('currentPassword', { required: 'Current password is required.' })}
            />
          </FormField>

          <FormField label="New password" htmlFor="newPassword" error={f.errors.newPassword?.message}>
            <PasswordInput
              id="newPassword"
              autoComplete="new-password"
              error={!!f.errors.newPassword}
              {...f.register('newPassword', f.passwordRules)}
            />
          </FormField>

          <PasswordRulesChecklist password={f.password} />

          <FormField
            label="Confirm new password"
            htmlFor="confirmPassword"
            error={f.errors.confirmPassword?.message}
          >
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              error={!!f.errors.confirmPassword}
              {...f.register('confirmPassword', f.confirmRules)}
            />
          </FormField>
            </form>
          </>
        )}
      </Modal>
    </>
  )
}
