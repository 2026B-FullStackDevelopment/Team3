import express, { type Express } from "express";
import {donorListingRoutes} from "../src/routes/donorListing.js";
import { auditLogRoutes } from "./modules/auditLog/routes/auditLog.routes.js";
import { errorHandler } from "./middleware/error.js";

// Annotated because tsconfig has `declaration: true`, which cannot name the
// inferred type across the pnpm virtual store.
const app: Express = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running",
  });
});

app.use("/api/donor/food-listings", donorListingRoutes);
app.use("/api/admin/audit-logs", auditLogRoutes);

// TODO: mount the remaining routers (collection, feedback, reservation,
// manualDonation, donorReport) as they are implemented.

app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
});

app.use(errorHandler);

export default app;
