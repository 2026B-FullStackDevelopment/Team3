import * as walletService from "../services/wallet.service.js";
import { validateDeposit } from "../validators/wallet.validators.js";

/**
 * GET /api/wallet  (protected — requireAuth + requireRole Recipient)
 * Returns the current recipient's wallet balance.
 */
export async function getWallet(req, res, next) {
  try {
    const wallet = await walletService.getBalance(req.user.userId);
    res.status(200).json({ wallet });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/wallet/deposit  (protected — requireAuth + requireRole Recipient)
 * Validates the amount, credits the wallet, returns the new balance + the
 * recorded transaction.
 */
export async function deposit(req, res, next) {
  try {
    const { amount } = validateDeposit(req.body);
    const result = await walletService.deposit(req.user.userId, amount);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/wallet/transactions  (protected — requireAuth + requireRole Recipient)
 * Returns the current recipient's transactions, newest first.
 */
export async function listTransactions(req, res, next) {
  try {
    const transactions = await walletService.listTransactions(req.user.userId);
    res.status(200).json({ transactions });
  } catch (error) {
    next(error);
  }
}
