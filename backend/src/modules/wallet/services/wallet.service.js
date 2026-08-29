import * as walletRepository from "../repositories/wallet.repository.js";
import * as transactionRepository from "../repositories/transaction.repository.js";
import { toWalletDTO } from "../dtos/wallet.dto.js";
import { toTransactionDTO, toTransactionDTOList } from "../dtos/transaction.dto.js";
import { TransactionType } from "../models/Transaction.js";
import { PaymentMethod } from "../../../shared/constants/paymentMethod.js";
import { ValidationError } from "../../../shared/errors/errors.js";
import { assertPositive, runInTransaction } from "../helpers/wallet.helper.js";

/** Current balance for the user's wallet (created on first access). */
export async function getBalance(userId) {
  const wallet = await walletRepository.getOrCreate(userId);
  return toWalletDTO(wallet);
}

/**
 * Deposits (tops up) the wallet: atomic credit + a Deposit ledger row. Simple
 * balance increment this phase — no real payment processing (D2). `method`
 * defaults to Card, representing an external top-up.
 */
export async function deposit(userId, amount, method = PaymentMethod.Card) {
  return runInTransaction(async (session) => {
    const wallet = await walletRepository.incrementBalance(userId, amount, session);
    const transaction = await transactionRepository.create(
      { userId, amount, type: TransactionType.Deposit, method },
      session,
    );
    return {
      wallet: toWalletDTO(wallet),
      transaction: toTransactionDTO(transaction),
    };
  });
}

/** The user's transactions, newest first. */
export async function listTransactions(userId) {
  const transactions = await transactionRepository.listByUserId(userId);
  return toTransactionDTOList(transactions);
}

// --- Core money operations, exposed to other modules via the WalletFacade. ---

/**
 * Credits a wallet (money in) and records a transaction. Used by the facade for
 * refunds/adjustments from other modules. Atomic + upserts the wallet.
 */
export async function credit(userId, amount, meta = {}) {
  assertPositive(amount);
  return runInTransaction(async (session) => {
    const wallet = await walletRepository.incrementBalance(userId, amount, session);
    await transactionRepository.create({ userId, amount, ...meta }, session);
    return toWalletDTO(wallet);
  });
}

/**
 * Debits a wallet (money out) if funds are sufficient, and records a
 * transaction. Used by the facade for food purchases / premium billing. The
 * guarded atomic decrement prevents overdraft; insufficient funds → 400.
 */
export async function debit(userId, amount, meta = {}) {
  assertPositive(amount);
  return runInTransaction(async (session) => {
    const wallet = await walletRepository.decrementBalance(userId, amount, session);
    if (!wallet) {
      // Aborts the transaction — no ledger row is written.
      throw new ValidationError("Insufficient wallet balance");
    }
    await transactionRepository.create({ userId, amount, ...meta }, session);
    return toWalletDTO(wallet);
  });
}
