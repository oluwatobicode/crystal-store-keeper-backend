"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controllers_1 = require("../controllers");
const router = (0, express_1.default)();
router.get("/sales-analysis", controllers_1.reportController.salesAnalysisReport);
router.get("/product-analysis", controllers_1.reportController.productAnalysisReport);
router.get("/payment-method", controllers_1.reportController.paymentMethodReport);
router.get("/stock-movement", controllers_1.reportController.stockMovementReports);
exports.default = router;
