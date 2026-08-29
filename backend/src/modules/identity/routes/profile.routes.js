import { Router } from "express";
import * as profileController from "../controllers/profile.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role.js";
import { avatarUpload } from "../../../middleware/upload.js";
import { userRole } from "../models/User.js";

const router = Router();

router.get("/", requireAuth, requireRole(userRole.Recipient, userRole.Donor), profileController.getProfile);
router.patch("/", requireAuth, requireRole(userRole.Recipient, userRole.Donor), profileController.updateProfile);
router.patch("/change-password", requireAuth, requireRole(userRole.Recipient, userRole.Donor), profileController.changePassword);
router.post("/avatar", requireAuth, requireRole(userRole.Recipient, userRole.Donor), avatarUpload, profileController.uploadAvatar);
router.delete("/avatar", requireAuth, requireRole(userRole.Recipient, userRole.Donor), profileController.removeAvatar);

export const profileRoutes = router;
