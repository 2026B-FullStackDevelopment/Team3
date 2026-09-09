import { AuthSplitLayout } from '@/features/identity/Component/AuthSplitLayout.jsx'
import { BrandPanel } from '@/features/identity/Component/BrandPanel.jsx'
import { LoginForm } from '@/features/identity/Component/LoginForm.jsx'

/**
 * Login page (route: /login). Thin composition: the marketing BrandPanel on the
 * left and the LoginForm on the right, inside the shared AuthSplitLayout.
 */

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 12-4 16-9 16Z" />
      <path d="M4 20c4-4 6-6 12-8" />
    </svg>
  )
}

const FEATURES = [
  { icon: <PinIcon />, title: 'Local & accessible', text: 'Find food close to you.' },
  { icon: <HeartIcon />, title: 'Support your community', text: 'Help businesses. Help neighbors.' },
  { icon: <LeafIcon />, title: 'Reduce waste', text: 'Good for people and the planet.' },
]

export function LoginPage() {
  return (
    <AuthSplitLayout
      left={
        <BrandPanel
          chip="Welcome back"
          heading="Good food starts with better choices."
          blurb="Log in to continue connecting with surplus food near you — free, affordable, and just around the corner."
          features={FEATURES}
        />
      }
      right={<LoginForm />}
    />
  )
}
