"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_middlware_1 = require("../middleware/auth.middlware");
const router = (0, express_1.Router)();
router.get("/", auth_middlware_1.protectRoutes, controllers_1.settingsController.getBusinessProfile);
router.patch("/", auth_middlware_1.protectRoutes, (0, auth_middlware_1.authorize)("settings.manage"), controllers_1.settingsController.updateBusinessProfile);
// settings.routes.ts
router.post("/telegram/generate-code", auth_middlware_1.protectRoutes, (0, auth_middlware_1.authorize)("settings.manage"), controllers_1.settingsController.generateTelegramCode);
exports.default = router;
