import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authRoutes } from "./modules/identity/routes/auth.routes.js";
import { profileRoutes } from "./modules/identity/routes/profile.routes.js";
import { walletRoutes } from "./modules/wallet/routes/wallet.routes.js";
import { donorListingRoutes } from "./modules/donation/routes/donations.routes.js";
import { donorReportRoutes } from "./modules/donorReport/routes/donorReport.routes.js";
import { auditLogRoutes } from "./modules/admin/routes/auditLog.routes.js";
import { errorHandler } from "./middleware/error.js";
import { reservationRoutes } from "./modules/reservation/routes/reservationRoutes.js";
import { notificationPreferenceRoutes } from "./modules/notification/routes/notificationPreference.routes.js";
import { paymentsWebhookRoutes } from "./modules/payments/routes/paymentsWebhook.routes.js";
import { registerPaymentHandlers } from "./modules/identity/index.js";
import { registerPaymentHandlers as registerReservationPaymentHandlers } from "./modules/reservation/index.js";
import { notificationRoutes } from "./modules/notification/routes/notification.routes.js";
import { feedbackRoutes } from "./modules/feedback/routes/feedback.routes.js";
import { recipientListingRoutes } from "./modules/donation/routes/recipientListing.routes.js";
import { env } from "./config/env.js";

const app = express();

// The frontend is served from a different origin (its own Render domain), so the
// browser needs CORS with credentials to send/receive the httpOnly auth cookie.
// Origin comes from FRONTEND_ORIGIN (same value the Socket.IO gateway uses); a
// single explicit origin is required because credentialed CORS can't use "*".
app.use(cors({ origin: env.realtime.corsOrigin, credentials: true }));

registerPaymentHandlers();
registerReservationPaymentHandlers();

// Stripe webhook needs the raw body — mount before the JSON parser.
app.use("/api/payments/stripe", paymentsWebhookRoutes);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running",
  });
});
// Temporary browser shortcut requested for the Donation-first development
// phase. The plural path below remains the actual JSON API contract.
app.get("/api/donor/food-listing", (_req, res) => {
  if (env.isProduction) {
    return res
      .status(404)
      .json({ error: "NOT_FOUND", message: "Route not found" });
  }
  return res.redirect(302, "http://localhost:5173/donor/dashboard");
});
app.use("/api/donor/food-listings", donorListingRoutes);
app.use("/api/donor/reports", donorReportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/notification-preferences", notificationPreferenceRoutes);
app.use("/api/admin", auditLogRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/donations", recipientListingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/feedback", feedbackRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
});

app.use(errorHandler);

export default app;
