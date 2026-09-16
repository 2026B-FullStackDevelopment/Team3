import { formatVnd, vndToUsd } from '@/shared/utils/formatters.js'

/** Dark hero showing the wallet balance in VND with a USD approximation. */
export function BalanceCard({ balance }) {
  return (
    <div className="flex items-center justify-between rounded-card bg-ink p-6 text-white md:p-8">
      <div>
        <p className="text-sm text-white/70">Available balance</p>
        <p className="mt-1 font-heading text-4xl font-bold">{formatVnd(balance)}</p>
        <p className="mt-1 text-sm text-white/60">≈ {vndToUsd(balance).toFixed(2)} USD</p>
      </div>
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white/80"
        aria-hidden="true"
      >
        <rect x="2" y="6" width="20" height="13" rx="2" />
        <path d="M2 10h20" />
        <circle cx="17" cy="14" r="1" />
      </svg>
    </div>
  )
}
