/**
 * Maps a User (+ optional role profile) to the safe shape allowed across a route
 * response. Strips sensitive/internal fields (`passwordHash`, lockout counters)
 * per the DTO-at-every-boundary convention — never return a raw Mongoose doc.
 *
 * `displayName`/`avatarUrl` come from the role profile (RecipientProfile.userName
 * / DonorProfile.companyName + avatarUrl) so the frontend can show the current
 * user in the navbar. Both are null when there is no profile (e.g. Admin) or no
 * avatar has been uploaded.
 */
export function toUserDTO(user, profile = null) {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
    displayName: profile?.userName ?? profile?.companyName ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
  };
}
