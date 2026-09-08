import { Link } from 'react-router-dom'
import { Brand } from '@/shared/components/Brand/Brand.jsx'
import { Button } from '@/shared/components/Button/Button.jsx'
import { Input } from '@/shared/components/Input/Input.jsx'
import { PasswordInput } from '@/shared/components/PasswordInput/PasswordInput.jsx'
import { FormField } from '@/shared/components/FormField/FormField.jsx'
import { Alert } from '@/shared/components/Alert/Alert.jsx'
import { Modal } from '@/shared/components/Modal/Modal.jsx'
import { useLoginForm } from './useLoginForm.js'

/**
 * Login card: brand + headings, the email/password form, and the sign-up link,
 * per the sketch. On lockout the form body is replaced by the inline
 * "Authentication Locked" panel and a dark caution Modal shows the backend
 * message (D3). Behavior lives in useLoginForm. Tailwind classes inlined.
 */

function WarningTriangle({ className }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function LoginForm() {
  const f = useLoginForm()

  return (
    <div className="w-full max-w-md">
      {/* Brand */}
      <div className="flex flex-col items-center">
        <Brand size="lg" to="/" />
      </div>

      <div className="mt-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-ink">Log in to your account</h1>
        <p className="mt-2 text-sm text-muted">Welcome back! Please enter your details.</p>
      </div>

      {f.lock ? (
        /* Inline locked panel — replaces the form body while locked (D3). */
        <div className="mt-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
            <WarningTriangle />
          </div>
          <h2 className="mt-4 font-heading text-xl font-bold text-ink">Authentication Locked</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{f.lock.message}</p>
          <Button className="mt-6" fullWidth size="lg" onClick={f.clearLock}>
            Back to login
          </Button>
        </div>
      ) : (
        <>
          <form onSubmit={f.onSubmit} className="mt-8 space-y-5" noValidate>
            {f.banner && <Alert variant="error">{f.banner}</Alert>}

            <FormField label="Email" htmlFor="email" error={f.errors.email?.message}>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                error={!!f.errors.email}
                {...f.register('email', f.emailRules)}
              />
            </FormField>

            <FormField
              label="Password"
              htmlFor="password"
              error={f.errors.password?.message || f.credentialError}
            >
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                error={!!f.errors.password || !!f.credentialError}
                {...f.register('password', f.passwordRules)}
              />
            </FormField>

            <Button type="submit" fullWidth size="lg" loading={f.isSubmitting}>
              Log in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">New here? Sign up for an account</p>
          <Button to="/register" variant="secondary" fullWidth size="lg" className="mt-2">
            Sign up
          </Button>
        </>
      )}

      <p className="mt-8 text-center text-xs text-muted">
        By continuing, you agree to our{' '}
        <Link to="/#" className="font-medium text-primary hover:underline">
          Terms of Service
        </Link>
      </p>

      {/* Caution modal — dark variant from the sketch, message from the backend. */}
      <Modal
        open={f.showLockModal}
        onClose={f.dismissLockModal}
        className="bg-ink text-center text-white"
        footer={
          <Button fullWidth size="lg" onClick={f.dismissLockModal}>
            Dismiss
          </Button>
        }
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger text-white">
          <WarningTriangle />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted">{f.lock?.message}</p>
      </Modal>
    </div>
  )
}
