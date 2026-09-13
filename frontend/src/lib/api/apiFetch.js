import { notifyUnauthorized } from '@/config/api/sessionEvents.js'

export class ApiError extends Error {
  constructor({ status, code, message, details, cause }) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function isJsonBody(body) {
  return body != null && !(body instanceof FormData)
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

export async function apiFetch(path, options = {}) {
  const {
    body,
    headers,
    signal,
    suppressUnauthorized = false,
    ...requestOptions
  } = options
  const jsonBody = isJsonBody(body)

  let response
  try {
    response = await fetch(path, {
      ...requestOptions,
      credentials: 'include',
      headers: {
        ...(jsonBody ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: jsonBody ? JSON.stringify(body) : body,
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the server. Check your connection and try again.',
      cause: error,
    })
  }

  const payload = await readResponseBody(response)

  if (response.status === 401 && !suppressUnauthorized) {
    notifyUnauthorized()
  }

  if (!response.ok) {
    const structured = payload && typeof payload === 'object' ? payload : {}
    throw new ApiError({
      status: response.status,
      code: structured.error ?? `HTTP_${response.status}`,
      message:
        structured.message ??
        (typeof payload === 'string' && payload.trim()
          ? payload.trim()
          : response.statusText || 'The request failed.'),
      details: structured.details,
    })
  }

  return payload
}
