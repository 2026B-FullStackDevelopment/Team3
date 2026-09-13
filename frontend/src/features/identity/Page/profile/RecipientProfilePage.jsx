import { useState } from 'react'
import { PageHeader } from '@/shared/components/PageHeader.jsx'
import { useProfile } from '@/features/identity/Hook/profileHook.js'
import { ProfileView } from '@/features/identity/Component/profile/ProfileView.jsx'
import { EditProfileForm } from '@/features/identity/Component/profile/EditProfileForm.jsx'
import { ProfileSuccessBanner } from '@/features/identity/Component/profile/ProfileSuccessBanner.jsx'

/**
 * Recipient profile (route: /profile). Toggles inline between view and edit on
 * the same route; saving returns to view with a success banner.
 */
export function RecipientProfilePage() {
  const { profile, status, setProfile } = useProfile()
  const [editing, setEditing] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  if (status !== 'ready' || !profile) return null

  const contactItems = [
    { label: 'Username', value: profile.userName },
    { label: 'Email', value: profile.email },
    { label: 'Country', value: profile.country },
    { label: 'City', value: profile.city },
    { label: 'Password', value: '••••••••' },
  ]

  return (
    <>
      <PageHeader
        title={editing ? 'Edit Profile' : 'Recipient Profile'}
        subtitle={
          editing
            ? 'Update your contact details and profile photo.'
            : 'Edit contact details, upload an avatar, and manage Premium subscription status.'
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
          showSubscription
          onEdit={() => {
            setJustSaved(false)
            setEditing(true)
          }}
        />
      )}
    </>
  )
}
