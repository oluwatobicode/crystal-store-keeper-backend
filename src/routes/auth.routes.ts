import { Router } from "express";
import { authController } from "../controllers";

const router = Router();

router.post("/sign-up", authController.signUp);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

export default router;
