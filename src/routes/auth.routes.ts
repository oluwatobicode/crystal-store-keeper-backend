import { Router } from "express";
import { authController } from "../controllers";
import { protectRoutes } from "../middleware/auth.middlware";

const router = Router();

router.post("/sign-up", authController.signUp);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);
router.post("/reset-link", authController.sendPasswordResetLink);
router.post("/reset-password", authController.resetPassword);
router.patch("/change-password", protectRoutes, authController.changePassword);

export default router;
