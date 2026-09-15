import { Router } from "express";
import * as controller from "../controllers/notificationPreference.controller.js";
import { requireAuth } from "../../../middleware/auth.js";
import { requireRole } from "../../../middleware/role.js";
import { requirePremium } from "../../../middleware/requirePremium.js";
import { userRole } from "../../identity/index.js";

const router = Router();

// Premium recipients only (SRS 5.3.1). requirePremium also attaches
// req.recipientContext used by the controllers.
const guards = [requireAuth, requireRole(userRole.Recipient), requirePremium];

router.get("/", ...guards, controller.listPreferences);
router.post("/", ...guards, controller.createPreference);
router.patch("/:id", ...guards, controller.updatePreference);
router.delete("/:id", ...guards, controller.deletePreference);

export const notificationPreferenceRoutes = router;
