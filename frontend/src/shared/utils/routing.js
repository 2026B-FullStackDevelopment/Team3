import { USER_ROLES } from '@/config/constants.js'

/**
 * The landing route for an authenticated user of a given role. Single source of
 * truth for post-auth redirects, the guest-only guard, and the user menu link.
 */
export function homePathForRole(role) {
  switch (role) {
    case USER_ROLES.RECIPIENT:
      return '/profile'
    case USER_ROLES.DONOR:
      return '/donor/profile'
    case USER_ROLES.ADMIN:
      return '/admin'
    default:
      return '/'
  }
}
