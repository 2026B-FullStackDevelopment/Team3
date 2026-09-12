// Shared session-expiry signal used by every frontend HTTP transport.
const unauthorizedListeners = new Set()

export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

export function notifyUnauthorized() {
  unauthorizedListeners.forEach((listener) => listener())
}
