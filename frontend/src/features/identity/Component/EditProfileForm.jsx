import { useRef } from 'react'
import { VN_CITIES } from '@/config/constants.js'
import { Card } from '@/shared/components/Card.jsx'
import { Button } from '@/shared/components/Button.jsx'
import { Input } from '@/shared/components/Input.jsx'
import { Select } from '@/shared/components/Select.jsx'
import { FormField } from '@/shared/components/FormField.jsx'
import { Alert } from '@/shared/components/Alert.jsx'
import { Avatar } from '@/shared/components/Avatar.jsx'
import { useEditProfileForm } from '@/features/identity/Hook/profileHook.js'
import { ChangePasswordModal } from '@/features/identity/Component/ChangePasswordModal.jsx'

/**
 * Edit Profile form for both roles (fields differ by `profile.role`), rendered
 * in place on the profile page. Avatar upload is inline; password change is a
 * separate modal. On save the hook calls `onSaved(updatedProfile)`; Cancel calls
 * `onCancel`. Behavior in useEditProfileForm. Tailwind inlined.
 */
export function EditProfileForm({ profile, onSaved, onCancel }) {
  const f = useEditProfileForm(profile, onSaved)
  const fileRef = useRef(null)
  const isDonor = profile.role === 'Donor'

  return (
    <Card>
      {f.banner && (
        <Alert variant="error" className="mb-6">
          {f.banner}
        </Alert>
      )}

      {/* Avatar uploader */}
      <div className="flex items-center gap-5">
        <Avatar src={f.avatarPreview} size="lg" className="h-16 w-16" />
        <div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              {f.fileName ? 'Choose different photo' : 'Upload new photo'}
            </Button>
            {f.avatarPreview && (
              <button
                type="button"
                onClick={f.onRemoveAvatar}
                className="text-sm font-semibold text-danger hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted">
            {f.fileName ? `${f.fileName} · ` : ''}JPEG, PNG or WebP up to 2&nbsp;MB. Auto-resized to
            256×256 for display.
          </p>
          {f.avatarError && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-danger">
              <span
                aria-hidden="true"
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white"
              >
                !
              </span>
              {f.avatarError}
            </p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => f.onPickFile(e.target.files?.[0])}
          />
        </div>
      </div>

      <form onSubmit={f.onSubmit} className="mt-8 space-y-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          {isDonor ? (
            <FormField label="Company Name" htmlFor="companyName" error={f.errors.companyName?.message}>
              <Input
                id="companyName"
                error={!!f.errors.companyName}
                {...f.register('companyName', f.companyNameRules)}
              />
            </FormField>
          ) : (
            <FormField label="Username" htmlFor="userName" error={f.errors.userName?.message}>
              <Input id="userName" error={!!f.errors.userName} {...f.register('userName', f.userNameRules)} />
            </FormField>
          )}

          <FormField label="Email" htmlFor="email" error={f.errors.email?.message}>
            <Input id="email" type="email" error={!!f.errors.email} {...f.register('email', f.emailRules)} />
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Country" htmlFor="country">
            <Input id="country" value="Vietnam" disabled readOnly />
          </FormField>
          <FormField label="City" htmlFor="city" error={f.errors.city?.message}>
            <Select id="city" options={VN_CITIES} error={!!f.errors.city} {...f.register('city', f.cityRules)} />
          </FormField>
        </div>

        {isDonor && (
          <FormField label="Address" htmlFor="address" error={f.errors.address?.message}>
            <Input id="address" placeholder="Street, ward, district" {...f.register('address', f.addressRules)} />
          </FormField>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <ChangePasswordModal />
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="md" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" size="md" loading={f.isSubmitting}>
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}
