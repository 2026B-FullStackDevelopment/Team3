import { env } from '@/config/env.js'
import { notifyUnauthorized } from '@/config/api/sessionEvents.js'

export { onUnauthorized } from '@/config/api/sessionEvents.js'

/**
 * REST HTTP Helper (SRS A.2.b).
 *
 * A single utility for sending GET/POST/PUT/PATCH/DELETE requests with request
 * headers and body, returning a normalized result:
 *
 *   { data, status, headers, ok, error }
 *
 * It never throws on an HTTP error status — the calling Service decides how to
 * react. Auth rides an httpOnly cookie, so every request sends credentials and
 * carries no token in JS.
 */

function buildUrl(path, params) {
  const base = `${env.API_BASE_URL}${path}`
  if (!params) return base
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
  ).toString()
  return query ? `${base}?${query}` : base
}

async function request(method, path, { body, headers, params, signal, suppressUnauthorized } = {}) {
  const isFormData = body instanceof FormData
  const init = {
    method,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    signal,
  }
  if (body !== undefined) {
    init.body = isFormData ? body : JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(buildUrl(path, params), init)
  } catch (networkError) {
    return { data: null, status: 0, headers: null, ok: false, error: networkError }
  }

  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null)

  // A 401 normally means the session cookie is expired/revoked → notify so the
  // AuthProvider clears the session. Callers whose 401 is a domain error (e.g.
  // "current password incorrect" on change-password) pass `suppressUnauthorized`
  // to opt out of that global logout.
  if (response.status === 401 && !suppressUnauthorized) {
    notifyUnauthorized()
  }

  return {
    data,
    status: response.status,
    headers: response.headers,
    ok: response.ok,
    error: response.ok ? null : data,
  }
}

export const httpClient = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  put: (path, body, options) => request('PUT', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
}
