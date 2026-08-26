import express from "express";
import cookieParser from "cookie-parser";
import { authRoutes } from "./modules/identity/routes/auth.routes.js";
import { donorListingRoutes } from "./modules/donation/routes/donorListing.routes.js";
import { donorReportRoutes } from "./modules/donorReport/routes/donorReport.routes.js";
import { auditLogRoutes } from "./modules/admin/routes/auditLog.routes.js";
import { errorHandler } from "./middleware/error.js";
import { reservationRoutes } from "./modules/reservation/routes/reservationRoutes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

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
// app.use("/api/donor/food-listings", donorListingRoutes);
app.use("/api/admin/audit-logs", auditLogRoutes);
app.use("/api/reservations", reservationRoutes);

// TODO: mount the remaining routers (donation, reservation, feedback,
// notification, admin) as they are implemented.

app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
});

app.use(errorHandler);

export default app;
