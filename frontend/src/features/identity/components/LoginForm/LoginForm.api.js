/**
 * API seam for the login form.
 *
 * Login is the sanctioned AuthProvider exception: the actual request goes
 * through `AuthProvider.login()` (injected as `login`), which calls the domain
 * `authService` and refreshes the session on success — so this seam must NOT
 * call `authService` again (that would double-request and desync the session).
 * Its job is to run that call and classify the normalized httpClient result
 * into a UI outcome, keeping the network→UI mapping out of the component.
 *
 * Backend contract (docs/AUTHENTICATION + identity auth.service):
 *   200 → success (+ httpOnly cookie)
 *   401 "Account is temporarily locked …"  → locked
 *   401 "Invalid email or password"        → invalid credentials
 *   403 "This account has been deactivated"→ deactivated
 */
export async function submitLogin(login, credentials) {
  const result = await login(credentials)

  if (result.ok) return { outcome: 'ok' }

  const message = result.error?.message ?? result.data?.message ?? ''

  if (result.status === 401 && /lock/i.test(message)) {
    return { outcome: 'locked', message }
  }
  if (result.status === 401) {
    return { outcome: 'invalid', message: message || 'Invalid email or password' }
  }
  if (result.status === 403) {
    return { outcome: 'deactivated', message: message || 'This account has been deactivated' }
  }
  return { outcome: 'error', message: 'Something went wrong. Please try again.' }
}
