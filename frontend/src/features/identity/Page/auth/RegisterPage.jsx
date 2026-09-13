import { useState } from 'react'
import { AuthSplitLayout } from '@/features/identity/Component/auth/AuthSplitLayout.jsx'
import { BrandPanel } from '@/features/identity/Component/auth/BrandPanel.jsx'
import { RegisterRecipientForm } from '@/features/identity/Component/auth/RegisterRecipientForm.jsx'
import { RegisterDonorForm } from '@/features/identity/Component/auth/RegisterDonorForm.jsx'
import { PinIcon, HeartIcon, LeafIcon } from '@/features/identity/Component/auth/authIcons.jsx'

/**
 * Register page (route: /register). Owns the role state; a single route renders
 * either the Recipient or Donor form with a role-swapped BrandPanel (D4). The
 * bottom "Sign up as …" button flips the role without navigating.
 */

const PANEL = {
  recipient: {
    chip: 'Welcome back',
    heading: 'Good food starts with better choices.',
    blurb:
      'Log in to continue connecting with surplus food near you — free, affordable, and just around the corner.',
    features: [
      { icon: <PinIcon />, title: 'Local & accessible', text: 'Find food close to you.' },
      { icon: <HeartIcon />, title: 'Support your community', text: 'Help businesses. Help neighbors.' },
      { icon: <LeafIcon />, title: 'Reduce waste', text: 'Good for people and the planet.' },
    ],
  },
  donor: {
    chip: 'Register donor',
    heading: 'Share food, Support Community, Reduce waste.',
    blurb:
      'Create an account to donate surplus food or discover nearby donations from local businesses and communities.',
    features: [
      { icon: <PinIcon />, title: 'Local & accessible', text: 'Find nearby food donations with ease.' },
      { icon: <HeartIcon />, title: 'Support your community', text: 'Connect donors with those who need food.' },
      { icon: <LeafIcon />, title: 'Reduce waste', text: 'Good for people and the planet.' },
    ],
  },
}

export function RegisterPage() {
  const [role, setRole] = useState('recipient')
  const copy = PANEL[role]

  return (
    <AuthSplitLayout
      left={
        <BrandPanel
          chip={copy.chip}
          heading={copy.heading}
          blurb={copy.blurb}
          features={copy.features}
        />
      }
      right={
        role === 'recipient' ? (
          <RegisterRecipientForm onSwitchToDonor={() => setRole('donor')} />
        ) : (
          <RegisterDonorForm onSwitchToRecipient={() => setRole('recipient')} />
        )
      }
    />
  )
}
