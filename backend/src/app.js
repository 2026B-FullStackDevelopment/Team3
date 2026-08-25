import express from "express";
import { donorListingRoutes } from "./modules/donation/routes/donorListing.js";
import { manualDonationRoutes } from "./modules/donation/routes/manualDonation.js";
import { DomainError } from "./shared/errors/errors.js";

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
app.use((req, res, next) => {
  const donorProfileId = req.header("x-donor-profile-id");
  if (donorProfileId) {
    res.locals.donorProfileId = donorProfileId;
  }
  next();
});
app.use("/api/donor/food-listings", donorListingRoutes);
app.use("/api/donor/food-listings/:id/manual-donations", manualDonationRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
});

app.use((error, _req, res, next) => {
  void next;
  if (error instanceof DomainError) {
    return res.status(error.statusCode).json({
      error: error.name,
      message: error.message,
    });
  }

  console.error(error);
  return res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
});

export default app;
