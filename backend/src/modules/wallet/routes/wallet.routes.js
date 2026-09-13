import { Router } from "express";
import * as walletController from "../controllers/wallet.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role.js";
import { userRole } from "../../identity/index.js";

const router = Router();

// Only recipients have wallets (the model is keyed to recipient users).
router.get("/", requireAuth, requireRole(userRole.Recipient), walletController.getWallet);
router.post("/deposit", requireAuth, requireRole(userRole.Recipient), walletController.deposit);
router.post("/topup/session", requireAuth, requireRole(userRole.Recipient), walletController.createTopUpSession);
router.get("/transactions", requireAuth, requireRole(userRole.Recipient), walletController.listTransactions);

export const walletRoutes = router;
