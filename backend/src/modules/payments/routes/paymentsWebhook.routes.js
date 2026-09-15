import express, { Router } from "express";
import * as paymentsController from "../controllers/payments.controller.js";

// Stripe signature verification needs the UNPARSED body, so this route uses
// express.raw and is mounted BEFORE the global express.json() in app.js.
const router = Router();
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentsController.stripeWebhook,
);

export const paymentsWebhookRoutes = router;
