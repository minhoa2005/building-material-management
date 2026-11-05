import { Router } from "express";
import { login, logout, getMe, refreshToken } from "./auth.controller.js";
import { validate } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/auth.js";
import { loginSchema } from "./auth.validation.js";

const router = Router();

router.post("/login", validate(loginSchema), login);
// Cookie cleanup must also work when the access token is expired or missing.
router.post("/logout", logout);
router.get("/me", authenticate, getMe);
router.post("/refresh", refreshToken);

export default router;
