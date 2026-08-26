import { Router } from "express";
import * as profileController from "../controllers/profile.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role.js";
import { userRole } from "../models/User.js";

const router = Router();

router.get("/", requireAuth, requireRole(userRole.Recipient, userRole.Donor), profileController.getProfile);
router.patch("/", requireAuth, requireRole(userRole.Recipient, userRole.Donor), profileController.updateProfile);

export const profileRoutes = router;
