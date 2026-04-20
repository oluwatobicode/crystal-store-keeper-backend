"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_middlware_1 = require("../middleware/auth.middlware");
const router = (0, express_1.Router)();
router.post("/record-repayment", auth_middlware_1.protectRoutes, controllers_1.recordRepaymentController.recordRepayment);
router.get("/customer/:customerId/credit-history", auth_middlware_1.protectRoutes, controllers_1.recordRepaymentController.customerCreditHistory);
exports.default = router;
