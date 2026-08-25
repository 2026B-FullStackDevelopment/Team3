import express from "express";
import { authRoutes } from "./modules/identity/routes/auth.routes.js";
import { errorHandler } from "./middleware/error.js";

const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running",
  });
});

app.use("/api/auth", authRoutes);

// TODO: mount the remaining routers (donation, reservation, feedback,
// notification, admin) as they are implemented.

app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
});

// Error handler goes last, after all routes.
app.use(errorHandler);

export default app;
