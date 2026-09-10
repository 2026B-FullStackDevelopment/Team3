import { createContext } from 'react'

/**
 * The auth session context instance. Kept in its own module so the provider file
 * exports only a component (required for React Fast Refresh).
 */
export const AuthContext = createContext(null)
