import { useAccounts } from '@/features/admin/hooks/useAccounts.js'
import { ACCOUNT_STATUS, USER_ROLES } from '@/config/constants.js'
import { Pagination } from '@/shared/components/Pagination.jsx'
import { cn } from '@/shared/utils/cn.js'

const STATUS_OPTIONS = [
  { value: '', label: 'Status' },
  { value: ACCOUNT_STATUS.ACTIVE, label: 'Active' },
  { value: ACCOUNT_STATUS.DEACTIVATED, label: 'Inactive' },
]

// Admin accounts are deliberately not an option here: the backend's
// GET /api/admin/accounts (SRS 7.1.1) only ever lists Recipient/Donor rows
// and rejects any other `role` value, so an "Admin" choice would look
// selectable but always fail.
const ROLE_OPTIONS = [
  { value: '', label: 'Role' },
  { value: USER_ROLES.DONOR, label: 'Donor' },
  { value: USER_ROLES.RECIPIENT, label: 'Recipient' },
]

// The backend's account-status enum value is "Deactivated"; the design
// calls that same state "Inactive". This is presentation-only copy, not a
// third status.
const STATUS_DISPLAY = {
  [ACCOUNT_STATUS.ACTIVE]: 'Active',
  [ACCOUNT_STATUS.DEACTIVATED]: 'Inactive',
}

/** User Management page (SRS 7.1.1/7.2.1). Deactivate/Reactivate call
 * straight into useAccounts's handlers -- window.confirm is enough of a
 * safety check here (no confirm-dialog pattern exists elsewhere to reuse,
 * and this scope doesn't call for building one). */
export function UserManagementPage() {
  const {
    accounts,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    currentPage,
    totalPages,
    goToPage,
    actingAccountIds,
    accountActionErrors,
    handleDeactivate,
    handleReactivate,
  } = useAccounts()

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink sm:text-2xl">User Management Dashboard</h1>
      <p className="mt-1 text-muted">Manage platform users, roles, and account statuses.</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by Donor Name, Donor ID, or Donation ID..."
          className="w-full rounded-card bg-surface px-4 py-2 text-ink placeholder:text-muted sm:min-w-64 sm:flex-1"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="w-full rounded-card bg-surface px-4 py-2 text-ink sm:w-auto"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="w-full rounded-card bg-surface px-4 py-2 text-ink sm:w-auto"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-card">
        <table className="w-full text-left text-sm sm:text-base">
          <thead>
            <tr className="bg-primary text-white">
              <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Account ID</th>
              <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Username</th>
              <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Email</th>
              <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Role</th>
              <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Status</th>
              <th className="px-3 py-2 sm:px-4 sm:py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="bg-surface px-4 py-6 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="bg-surface px-4 py-6 text-center text-danger">
                  Couldn't load accounts.
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="bg-surface px-4 py-6 text-center text-muted">
                  No accounts found.
                </td>
              </tr>
            ) : (
              accounts.map((account, index) => (
                <tr key={account.id} className={index % 2 === 0 ? 'bg-surface' : 'bg-cream'}>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{account.id}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{account.username}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{account.email}</td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-ink">{account.role}</td>
                  <td
                    className={cn(
                      'px-3 py-2 sm:px-4 sm:py-3 font-semibold',
                      account.accountStatus === ACCOUNT_STATUS.ACTIVE ? 'text-primary' : 'text-danger',
                    )}
                  >
                    {STATUS_DISPLAY[account.accountStatus] ?? account.accountStatus}
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3">
                    {account.accountStatus === ACCOUNT_STATUS.ACTIVE ? (
                      <button
                        type="button"
                        disabled={actingAccountIds.has(account.id)}
                        onClick={() => {
                          if (window.confirm(`Deactivate ${account.username ?? account.email}?`)) {
                            handleDeactivate(account.id)
                          }
                        }}
                        className="rounded-card bg-danger px-4 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actingAccountIds.has(account.id) ? 'Deactivating…' : 'Deactivate'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={actingAccountIds.has(account.id)}
                        onClick={() => {
                          if (window.confirm(`Reactivate ${account.username ?? account.email}?`)) {
                            handleReactivate(account.id)
                          }
                        }}
                        className="rounded-card bg-primary px-4 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actingAccountIds.has(account.id) ? 'Reactivating…' : 'Reactivate'}
                      </button>
                    )}
                    {accountActionErrors[account.id] && (
                      <p className="mt-1 text-xs text-danger">{accountActionErrors[account.id]}</p>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
    </div>
  )
}
