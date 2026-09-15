import { Router } from "express";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role.js";
import { userRole } from "../../identity/index.js";
import * as feedbackController from "../controllers/feedback.js";

export const feedbackRoutes = Router();

feedbackRoutes.use(requireAuth, requireRole(userRole.Recipient));

// POST /api/feedback/reservations/:reservationId
feedbackRoutes.post("/reservations/:reservationId", feedbackController.submitFeedback);
