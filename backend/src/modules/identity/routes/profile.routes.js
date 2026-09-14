import { randomUUID } from "node:crypto";
import { Router } from "express";
import * as profileController from "../controllers/profile.controller.js";
import * as subscriptionController from "../controllers/subscription.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role.js";
import { uploadImage } from "../../../middleware/uploadImage.js";
import { MAX_AVATAR_BYTES } from "../../../shared/upload/validators/upload.js";
import { userRole } from "../models/User.js";

const router = Router();

const avatarUpload = uploadImage({
  fieldName: "avatar",
  folder: "avatars",
  maxBytes: MAX_AVATAR_BYTES,
  sniffContent: true,
  transform: { width: 256, height: 256, crop: "fill", gravity: "auto" },
  keyFor: (req) => `avatars/${req.user.userId}-${randomUUID()}`,
});

router.get("/", requireAuth, requireRole(userRole.Recipient, userRole.Donor), profileController.getProfile);
router.patch("/", requireAuth, requireRole(userRole.Recipient, userRole.Donor), profileController.updateProfile);
router.patch("/change-password", requireAuth, requireRole(userRole.Recipient, userRole.Donor), profileController.changePassword);
router.post("/avatar", requireAuth, requireRole(userRole.Recipient, userRole.Donor), avatarUpload, profileController.uploadAvatar);
router.delete("/avatar", requireAuth, requireRole(userRole.Recipient, userRole.Donor), profileController.removeAvatar);

router.post("/subscribe", requireAuth, requireRole(userRole.Recipient), subscriptionController.subscribe);
router.post("/subscribe/checkout", requireAuth, requireRole(userRole.Recipient), subscriptionController.subscribeCheckout);

export const profileRoutes = router;
