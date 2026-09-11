import { Link } from 'react-router-dom'
import { VN_CITIES } from '@/config/constants.js'
import { Button } from '@/shared/components/Button.jsx'
import { Input } from '@/shared/components/Input.jsx'
import { PasswordInput } from '@/shared/components/PasswordInput/PasswordInput.jsx'
import { Select } from '@/shared/components/Select.jsx'
import { FormField } from '@/shared/components/FormField.jsx'
import { Alert } from '@/shared/components/Alert.jsx'
import { useRegisterDonorForm } from '@/features/identity/Hook/authHook.js'
import { PasswordRulesChecklist } from '@/features/identity/Component/PasswordRulesChecklist.jsx'

/**
 * Donor sign-up form. Behavior lives in useRegisterDonorForm (incl. geolocation).
 * Presentation only. `onSwitchToRecipient` flips the RegisterPage role. Tailwind inlined.
 */
export function RegisterDonorForm({ onSwitchToRecipient }) {
  const f = useRegisterDonorForm()

  return (
    <div className="w-full max-w-md">
      <form onSubmit={f.onSubmit} className="space-y-4" noValidate>
        {f.banner && <Alert variant="error">{f.banner}</Alert>}
        {f.locationError && <Alert variant="warning">{f.locationError}</Alert>}

        <FormField
          label="Email"
          htmlFor="email"
          required
          error={f.errors.email?.message || f.emailError}
        >
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            error={!!f.errors.email || !!f.emailError}
            {...f.register('email', f.emailRules)}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Company Name"
            htmlFor="companyName"
            required
            error={f.errors.companyName?.message}
          >
            <Input
              id="companyName"
              placeholder="Enter company name"
              error={!!f.errors.companyName}
              {...f.register('companyName', f.companyNameRules)}
            />
          </FormField>

          <FormField
            label="Tax Code"
            htmlFor="taxCode"
            required
            error={f.errors.taxCode?.message}
            hint="Tax Code must be 10–13 digits — e.g. 0312345678."
          >
            <Input
              id="taxCode"
              inputMode="numeric"
              placeholder="Enter tax code"
              error={!!f.errors.taxCode}
              {...f.register('taxCode', f.taxCodeRules)}
            />
          </FormField>
        </div>

        <FormField label="City" htmlFor="city" required error={f.errors.city?.message}>
          <Select
            id="city"
            placeholder="Select your location"
            options={VN_CITIES}
            error={!!f.errors.city}
            defaultValue=""
            {...f.register('city', f.cityRules)}
          />
        </FormField>

        <FormField label="Password" htmlFor="password" required error={f.errors.password?.message}>
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
          required
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

      <Button variant="secondary" fullWidth size="lg" className="mt-3" onClick={onSwitchToRecipient}>
        Sign up as a Recipient
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
