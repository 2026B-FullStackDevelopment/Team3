import express from "express";
import cookieParser from "cookie-parser";
import { authRoutes } from "./modules/identity/routes/auth.routes.js";
import { profileRoutes } from "./modules/identity/routes/profile.routes.js";
import { walletRoutes } from "./modules/wallet/routes/wallet.routes.js";
import { donorListingRoutes } from "./modules/donation/routes/donorListing.routes.js";
import { donorReportRoutes } from "./modules/donorReport/routes/donorReport.routes.js";
import { auditLogRoutes } from "./modules/admin/routes/auditLog.routes.js";
import { errorHandler } from "./middleware/error.js";
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
app.use((req, res, next) => {
  const donorProfileId = req.header("x-donor-profile-id");
  if (donorProfileId) {
    res.locals.donorProfileId = donorProfileId;
  }
  next();
});
app.use("/api/donor/food-listings", donorListingRoutes);
app.use("/api/donor/reports", donorReportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/donor/food-listings", donorListingRoutes);
app.use("/api/admin/audit-logs", auditLogRoutes);

// TODO: mount the remaining routers (donation, reservation, feedback,
// notification, admin) as they are implemented.

app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
});

app.use(errorHandler);

export default app;
