import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../../../middleware/auth.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.post("/logout", requireAuth, authController.logout);

export const authRoutes = router;
