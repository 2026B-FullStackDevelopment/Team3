import { Card } from '@/shared/components/Card.jsx'
import { formatShortDate, formatVnd } from '@/shared/utils/formatters.js'

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="6" width="20" height="13" rx="2" />
          <path d="M2 10h20" />
        </svg>
      </span>
      <p className="mt-3 font-semibold text-ink">No transactions yet</p>
      <p className="mt-1 max-w-xs text-sm text-muted">
        Deposit funds to start paying for food collections and your Premium subscription.
      </p>
    </div>
  )
}

/**
 * Recent transactions table (newest first) with an empty state. Pure
 * presentation — each row is a walletModel view-model { id, amount, createdAt,
 * label, incoming }.
 */
export function TransactionList({ transactions }) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Recent transactions</p>
      {transactions.length === 0 ? (
        <EmptyState />
      ) : (
        <table className="mt-4 w-full text-left">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="pb-2 font-semibold">Date</th>
              <th className="pb-2 font-semibold">Description</th>
              <th className="pb-2 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-t border-khaki-strong/40 text-sm">
                <td className="py-3 text-muted">{formatShortDate(tx.createdAt)}</td>
                <td className="py-3 text-ink">{tx.label}</td>
                <td className={`py-3 font-semibold ${tx.incoming ? 'text-primary' : 'text-ink'}`}>
                  {tx.incoming ? '+' : '−'}
                  {formatVnd(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}
