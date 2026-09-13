import express from "express";
import cookieParser from "cookie-parser";
import { authRoutes } from "./modules/identity/routes/auth.routes.js";
import { profileRoutes } from "./modules/identity/routes/profile.routes.js";
import { walletRoutes } from "./modules/wallet/routes/wallet.routes.js";
import { donorListingRoutes } from "./modules/donation/routes/donations.routes.js";
import { donorReportRoutes } from "./modules/donorReport/routes/donorReport.routes.js";
import { auditLogRoutes } from "./modules/admin/routes/auditLog.routes.js";
import { errorHandler } from "./middleware/error.js";
import { reservationRoutes } from "./modules/reservation/routes/reservationRoutes.js";
import { notificationPreferenceRoutes } from "./modules/notification/routes/notificationPreference.routes.js";
import { notificationRoutes } from "./modules/notification/routes/notification.routes.js";
import { env } from "./config/env.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

// Serve uploaded images (avatars) as static files. Filenames are
// server-generated; the DB stores only these URLs. Unauthenticated by design.
app.use("/upload", express.static(env.upload.dir));

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
app.use("/api/donor/food-listings", donorListingRoutes);
app.use("/api/admin", auditLogRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/notifications", notificationRoutes);

// TODO: mount remaining routers such as feedback as they are implemented.

app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
});

app.use(errorHandler);

export default app;
