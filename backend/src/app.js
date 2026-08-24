import express from "express";
import { donorListingRoutes } from "./modules/donations/routes/donorListing.js";

// Annotated because tsconfig has `declaration: true`, which cannot name the
// inferred type across the pnpm virtual store.
const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running",
  });
});

app.use("/api/donor/food-listings", donorListingRoutes);

// TODO: mount the remaining routers (collection, feedback, reservation,
// manualDonation, donorReport) as they are implemented.

app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
});

// TODO: `middleware/error.ts` goes here, after all routes.

export default app;
