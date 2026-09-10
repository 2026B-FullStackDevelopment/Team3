import { useContext } from 'react'
import { AuthContext } from '@/context/auth/context.js'

/** Access the authenticated session. Must be used within <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
