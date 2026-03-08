import { Router } from "express";
import { settingsController } from "../controllers";
import { protectRoutes, authorize } from "../middleware/auth.middlware";

const router = Router();

router.get("/", protectRoutes, settingsController.getBusinessProfile);
router.patch(
  "/",
  protectRoutes,
  authorize("settings.manage"),
  settingsController.updateBusinessProfile,
);
// settings.routes.ts
router.post(
  "/telegram/generate-code",
  protectRoutes,
  authorize("settings.manage"),
  settingsController.generateTelegramCode,
);

export default router;
