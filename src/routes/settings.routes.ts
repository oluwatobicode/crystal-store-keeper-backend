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

export default router;
