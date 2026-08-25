/**
 * Maps a User document to the safe shape allowed across a route response.
 * Strips sensitive/internal fields (`passwordHash`, lockout counters) per the
 * DTO-at-every-boundary convention — never return a raw Mongoose doc.
 */
export function toUserDTO(user) {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
  };
}
