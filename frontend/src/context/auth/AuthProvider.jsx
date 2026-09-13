import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '@/context/auth/context.js'
import { authService } from '@/features/identity/Service/authService.js'
import { formatAuthUser } from '@/features/identity/Model/authModel.js'
import { onUnauthorized } from '@/config/api/httpClient.js'

/**
 * Holds the authenticated session. Hydrates from GET /api/auth/me on mount
 * (cookie-based; no token in JS). A 401 from any request clears the session.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'authenticated' | 'anonymous'

  const loadSession = useCallback(async () => {
    const { data, ok } = await authService.me()
    if (ok && data) {
      setUser(formatAuthUser(data))
      setStatus('authenticated')
    } else {
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  useEffect(() => {
    // Async hydration on mount; the state update happens after the await, not
    // synchronously within the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSession()
  }, [loadSession])

  // Any 401 (expired/revoked cookie) drops us back to anonymous.
  useEffect(() => onUnauthorized(() => {
    setUser(null)
    setStatus('anonymous')
  }), [])

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials)
    if (result.ok) await loadSession()
    return result
  }, [loadSession])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo(
    () => ({ user, status, role: user?.role ?? null, login, logout, refresh: loadSession }),
    [user, status, login, logout, loadSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
