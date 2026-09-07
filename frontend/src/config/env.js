/**
 * Global runtime configuration (SRS A.1.4 — cross-cutting config kept separate).
 * In dev, API_BASE_URL is empty so requests hit the Vite proxy (/api → backend).
 */
export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? '',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL ?? '',
}
