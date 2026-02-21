import { Router } from "express";
import { settingsController } from "../controllers";

const router = Router();

router.get("/", settingsController.getBusinessProfile);
router.patch("/", settingsController.updateBusinessProfile);

export default router;
