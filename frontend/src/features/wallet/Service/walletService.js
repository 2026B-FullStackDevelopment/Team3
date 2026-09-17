import { httpClient } from '@/shared/api/apiFetch.js'
import { walletRoutes } from '@/config/api/routes/index.js'

/**
 * Wallet module Service (SRS A.1.3) — the module's only httpClient caller.
 * One function per wallet endpoint; returns the normalized
 * { data, status, ok, error } result upward.
 */
export const walletService = {
  getWallet: () => httpClient.get(walletRoutes.get),
  deposit: (amount) => httpClient.post(walletRoutes.deposit, { amount }),
  listTransactions: () => httpClient.get(walletRoutes.transactions),
}
