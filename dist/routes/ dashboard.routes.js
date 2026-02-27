"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
router.get("/analysis", controllers_1.dashboardController.dashboardAnalysis);
router.get("/low-stock", controllers_1.dashboardController.getLowStockProducts);
router.get("/recent-transactions", controllers_1.dashboardController.getRecentTransactions);
exports.default = router;
