/**
 * Wallet Model — pure formatters (F14 / FE_ARCHITECTURE §6.2). Maps a raw
 * Transaction DTO into the view-model TransactionList renders: a display label
 * and the money direction (`incoming`), so the component stays pure presentation.
 * No httpClient, no React.
 */

// Transaction type → display label + direction. Amounts are stored positive;
// `incoming` drives the +/- sign and colour in the UI.
const TX_META = {
  Deposit: { label: 'Deposit', incoming: true },
  SubscriptionPayment: { label: 'Premium sub.', incoming: false },
  FoodPurchase: { label: 'Food collection', incoming: false },
}

/** Maps one raw transaction DTO { id, amount, type, createdAt } to a view-model. */
export function formatTransaction(tx) {
  const meta = TX_META[tx.type] ?? { label: tx.type, incoming: false }
  return {
    id: tx.id,
    amount: tx.amount,
    createdAt: tx.createdAt,
    label: meta.label,
    incoming: meta.incoming,
  }
}

/** Maps a list of raw transactions (newest-first order preserved). */
export function formatTransactions(list) {
  return (list ?? []).map(formatTransaction)
}
