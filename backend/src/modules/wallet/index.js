/**
 * Wallet module public surface (Facade).
 *
 * Other modules move money ONLY through here — never by writing Wallet/
 * Transaction directly (ARCHITECTURE §4). All operations are addressed by
 * `userId`. `meta` carries the ledger fields for the recorded transaction:
 * `{ type, method, relatedReservationId }`.
 */
import * as walletService from "./services/wallet.service.js";

/** Current balance DTO for a user's wallet (created on first access). */
export function getBalance(userId) {
  return walletService.getBalance(userId);
}

/** Credits (money in) a user's wallet and records a transaction. */
export function credit(userId, amount, meta) {
  return walletService.credit(userId, amount, meta);
}

/**
 * Debits (money out) a user's wallet if funds suffice and records a transaction.
 * Throws on insufficient balance.
 */
export function debit(userId, amount, meta) {
  return walletService.debit(userId, amount, meta);
}
