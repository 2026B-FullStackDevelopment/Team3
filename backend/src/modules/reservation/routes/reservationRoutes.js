import { Router } from "express";
import { requireAuth } from "../../../middleware/auth.js";
import * as reservationController from "../controllers/reservationControllers.js";

export const reservationRoutes = Router();

// User required to login to reserve for food
reservationRoutes.use(requireAuth);

// POST /api/reservations
reservationRoutes.post("/", reservationController.createReservation);

// GET /api/reservations/history
reservationRoutes.get("/history", reservationController.getHistory);

// POST /api/reservations/checkout
reservationRoutes.post("/checkout", reservationController.createCheckoutSession);
