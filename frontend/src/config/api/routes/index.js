/**
 * Barrel of all API route configs, grouped by business domain (SRS A.2.a).
 * Services import from here; components never reference raw URL strings.
 */
export { authRoutes } from './auth.routes.js'
export { profileRoutes } from './profile.routes.js'
export { walletRoutes } from './wallet.routes.js'
// Skeletons for later modules (not yet built out):
export { donationRoutes } from './donation.routes.js'
export { reservationRoutes } from './reservation.routes.js'
export { adminRoutes } from './admin.routes.js'
export { notificationRoutes } from './notification.routes.js'
