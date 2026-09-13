import * as walletRepository from "../repositories/wallet.repository.js";
import * as transactionRepository from "../repositories/transaction.repository.js";
import { toWalletDTO } from "../dtos/wallet.dto.js";
import { toTransactionDTO, toTransactionDTOList } from "../dtos/transaction.dto.js";
import { TransactionType } from "../models/Transaction.js";
import { PaymentMethod } from "../../../shared/constants/paymentMethod.js";
import { ValidationError, ConflictError } from "../../../shared/errors/errors.js";
import { getStripe, isStripeEnabled } from "../../../config/stripe.js";
import { env } from "../../../config/env.js";
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
  if (isStripeEnabled()) {
    throw new ConflictError(
      "Simulated deposit is disabled; use card top-up (/api/wallet/topup/session)",
    );
  }
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

/**
 * Creates a Stripe Checkout Session for a wallet top-up and returns its hosted
 * URL. The wallet is NOT credited here — that happens only after the
 * signature-verified webhook (creditTopUp). 409 if Stripe is not configured.
 */
export async function createTopUpSession(userId, amount) {
  if (!isStripeEnabled()) {
    throw new ConflictError("Card top-up is not available");
  }
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "vnd",
          product_data: { name: "AFF Wallet top-up" },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: { userId, amount: String(amount) },
    success_url: `${env.stripe.frontendUrl}/wallet?topup=success`,
    cancel_url: `${env.stripe.frontendUrl}/wallet?topup=cancel`,
  });
  return { url: session };
}

/**
 * Credits the wallet for a completed Stripe top-up, exactly once. The
 * sparse-unique stripeSessionId makes a re-delivered webhook's insert fail with
 * a duplicate-key error (code 11000), which rolls back the whole transaction —
 * no double credit. Returns the updated wallet DTO, or null if this session was
 * already credited.
 */
export async function creditTopUp(userId, amount, stripeSessionId) {
  try {
    return await runInTransaction(async (session) => {
      const wallet = await walletRepository.incrementBalance(userId, amount, session);
      await transactionRepository.create(
        {
          userId,
          amount,
          type: TransactionType.Deposit,
          method: PaymentMethod.Card,
          stripeSessionId,
        },
        session,
      );
      return toWalletDTO(wallet);
    });
  } catch (error) {
    if (error?.code === 11000) {
      // Already processed (duplicate stripeSessionId) — no-op.
      return null;
    }
    throw error;
  }
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
export async function debit(userId, amount, meta = {}, options = {}) {
  assertPositive(amount);
  const work = async (session) => {
    const wallet = await walletRepository.decrementBalance(userId, amount, session);
    if (!wallet) {
      // Aborts the transaction — no ledger row is written.
      throw new ValidationError("Insufficient wallet balance");
    }
    await transactionRepository.create({ userId, amount, ...meta }, session);
    return toWalletDTO(wallet);
  };
  // When a caller supplies its own session, join that transaction so the debit
  // commits or rolls back atomically with the caller's other writes (e.g. the
  // premium claim). Otherwise run standalone in a fresh transaction.
  if (options.session) {
    return work(options.session);
  }
  return runInTransaction(work);
}
