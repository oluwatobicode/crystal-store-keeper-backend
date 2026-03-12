"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_middlware_1 = require("../middleware/auth.middlware");
const router = (0, express_1.Router)();
router.get("/", auth_middlware_1.protectRoutes, (0, auth_middlware_1.authorize)("audit.view"), controllers_1.auditLogController.getAllLogs);
router.get("/export-csv", auth_middlware_1.protectRoutes, (0, auth_middlware_1.authorize)("audit.view"), controllers_1.auditLogController.exportLogs);
exports.default = router;
