import { env } from '@/config/env.js'
import { notifyUnauthorized, onUnauthorized } from '@/config/api/sessionEvents.js'

export { onUnauthorized }

export class ApiError extends Error {
  constructor({ status, code, message, details, cause }) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function buildUrl(path, params) {
  const base = `${env.API_BASE_URL}${path}`
  if (!params) return base
  const query = new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  ).toString()
  return query ? `${base}?${query}` : base
}

function isFormData(body) {
  return typeof FormData !== 'undefined' && body instanceof FormData
}

async function readResponseBody(response) {
  if (response.status === 204) return undefined

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json().catch(() => undefined)
  }

  const text = await response.text().catch(() => '')
  return text || undefined
}

/** SRS A.2.b REST transport. Every request exposes data, status, headers and ok. */
async function request(method, path, options = {}) {
  const { body, headers, params, signal, suppressUnauthorized = false } = options
  const formDataBody = isFormData(body)
  const hasBody = body !== undefined

  let response
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      credentials: 'include',
      headers: {
        ...(!formDataBody && hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: hasBody ? (formDataBody ? body : JSON.stringify(body)) : undefined,
      signal,
    })
  } catch (networkError) {
    return { data: null, status: 0, headers: null, ok: false, error: networkError }
  }

  const data = await readResponseBody(response)

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

/** Converts the canonical REST result into data or a structured React Query error. */
export function unwrapHttpResponse(result) {
  if (result.ok) return result.data

  const structured = result.error && typeof result.error === 'object' ? result.error : {}
  throw new ApiError({
    status: result.status,
    code: structured.error ?? (result.status ? `HTTP_${result.status}` : 'NETWORK_ERROR'),
    message:
      structured.message ??
      (typeof result.error === 'string' && result.error.trim()
        ? result.error.trim()
        : result.status
          ? 'The request failed.'
          : 'Unable to reach the server. Check your connection and try again.'),
    details: structured.details,
    cause: result.status === 0 ? result.error : undefined,
  })
}
