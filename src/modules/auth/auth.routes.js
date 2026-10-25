import { Router } from "express";
import { login, getMe, refreshToken } from "./auth.controller.js";
import { validate } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/auth.js";
import { loginSchema } from "./auth.validation.js";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.get("/me", authenticate, getMe);
router.post("/refresh", refreshToken);

export default router;
