import { Link } from 'react-router-dom'
import { VN_CITIES } from '@/config/constants.js'
import { Button } from '@/shared/components/Button.jsx'
import { Input } from '@/shared/components/Input.jsx'
import { PasswordInput } from '@/shared/components/PasswordInput/PasswordInput.jsx'
import { Select } from '@/shared/components/Select.jsx'
import { FormField } from '@/shared/components/FormField.jsx'
import { Alert } from '@/shared/components/Alert.jsx'
import { useRegisterRecipientForm } from '@/features/identity/Hook/authHook.js'
import { PasswordRulesChecklist } from '@/features/identity/Component/common/PasswordRulesChecklist.jsx'

/**
 * Recipient sign-up form. Behavior lives in useRegisterRecipientForm; this is
 * presentation only. `onSwitchToDonor` flips the RegisterPage role. Tailwind inlined.
 */
export function RegisterRecipientForm({ onSwitchToDonor }) {
  const f = useRegisterRecipientForm()

  return (
    <div className="w-full max-w-md">
      <form onSubmit={f.onSubmit} className="space-y-4" noValidate>
        {f.banner && <Alert variant="error">{f.banner}</Alert>}

        <FormField
          label="Username"
          htmlFor="userName"
          error={f.errors.userName?.message}
          hint="English letters, numbers, underscore (_) or hyphen (-) only — e.g. jane_doe-01."
        >
          <Input
            id="userName"
            placeholder="Enter your username"
            autoComplete="username"
            error={!!f.errors.userName}
            {...f.register('userName', f.userNameRules)}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" error={f.errors.email?.message || f.emailError}>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            error={!!f.errors.email || !!f.emailError}
            {...f.register('email', f.emailRules)}
          />
        </FormField>

        <FormField label="City" htmlFor="city" error={f.errors.city?.message}>
          <Select
            id="city"
            placeholder="Select your location"
            options={VN_CITIES}
            error={!!f.errors.city}
            defaultValue=""
            {...f.register('city', f.cityRules)}
          />
        </FormField>

        <FormField label="Password" htmlFor="password" error={f.errors.password?.message}>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            autoComplete="new-password"
            error={!!f.errors.password}
            {...f.register('password', f.passwordRules)}
          />
        </FormField>

        <PasswordRulesChecklist password={f.password} />

        <FormField
          label="Confirm Password"
          htmlFor="confirmPassword"
          error={f.errors.confirmPassword?.message}
        >
          <PasswordInput
            id="confirmPassword"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            error={!!f.errors.confirmPassword}
            {...f.register('confirmPassword', f.confirmRules)}
          />
        </FormField>

        <Button type="submit" fullWidth size="lg" loading={f.isSubmitting}>
          Sign up
        </Button>
      </form>

      <Button variant="secondary" fullWidth size="lg" className="mt-3" onClick={onSwitchToDonor}>
        Sign up as a Donor
      </Button>

      <p className="mt-6 text-center text-sm text-muted">
        Have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
