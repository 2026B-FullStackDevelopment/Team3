/**
 * Maps a User (+ its role profile, if any) to the Admin account-listing shape
 * SRS 7.1.1 asks for: Account ID, Username, Email, Role, Account Status.
 * Recipients have a `userName`; Donors have no username field at all (1B
 * registration uses `companyName` instead) — `username` here resolves to
 * whichever the role actually has, so the column is always populated.
 */
export function toAccountSummaryDTO(user, profile) {
  return {
    id: user._id,
    username: profile?.userName ?? profile?.companyName ?? null,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
  };
}
