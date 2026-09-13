import { useState } from 'react'
import { PageHeader } from '@/shared/components/PageHeader.jsx'
import { useProfile } from '@/features/identity/Hook/profileHook.js'
import { ProfileView } from '@/features/identity/Component/profile/ProfileView.jsx'
import { EditProfileForm } from '@/features/identity/Component/profile/EditProfileForm.jsx'
import { ProfileSuccessBanner } from '@/features/identity/Component/profile/ProfileSuccessBanner.jsx'

/**
 * Donor profile (route: /donor/profile). Same inline view↔edit pattern as the
 * recipient page, with the donor's extra fields and no subscription section.
 */
export function DonorProfilePage() {
  const { profile, status, setProfile } = useProfile()
  const [editing, setEditing] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  if (status !== 'ready' || !profile) return null

  const contactItems = [
    { label: 'Company Name', value: profile.companyName },
    { label: 'Tax Code', value: profile.taxCode },
    { label: 'Email', value: profile.email },
    { label: 'Country', value: profile.country },
    { label: 'City', value: profile.city },
    { label: 'Address', value: profile.address ?? '—' },
    { label: 'Password', value: '••••••••' },
  ]

  return (
    <>
      <PageHeader
        title={editing ? 'Edit Profile' : 'Donor Profile'}
        subtitle={
          editing
            ? 'Update your company details and profile photo.'
            : 'Edit your company details, address, and profile photo.'
        }
      />
      {justSaved && !editing && <ProfileSuccessBanner onDismiss={() => setJustSaved(false)} />}
      {editing ? (
        <EditProfileForm
          profile={profile}
          onSaved={(updated) => {
            setProfile(updated)
            setEditing(false)
            setJustSaved(true)
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <ProfileView
          profile={profile}
          contactItems={contactItems}
          showSubscription={false}
          onEdit={() => {
            setJustSaved(false)
            setEditing(true)
          }}
        />
      )}
    </>
  )
}
