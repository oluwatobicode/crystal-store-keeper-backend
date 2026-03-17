"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const db_config_1 = require("./config/db.config");
const routes_1 = require("./routes");
require("./services/telegram.service");
const cors_1 = __importDefault(require("cors"));
const error_middlware_1 = require("./middleware/error.middlware");
const telegram_service_1 = __importDefault(require("./services/telegram.service"));
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
(0, db_config_1.connectDb)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        "https://crystal-stock-keeper.vercel.app",
        "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Test route
app.get("/", (req, res) => {
    res.json({
        message: "Crystal Stock Keeper API",
        version: "1.0.0",
        status: "running",
    });
});
// loggin in
app.use("/api/v1/auth", routes_1.authRoutes);
// protected routes
app.use("/api/v1/products", routes_1.productRoutes);
app.use("/api/v1/suppliers", routes_1.supplierRoutes);
app.use("/api/v1/customers", routes_1.customerRoutes);
app.use("/api/v1/roles", routes_1.rolesRoutes);
app.use("/api/v1/sales", routes_1.salesRoutes);
app.use("/api/v1/users", routes_1.userRoutes);
app.use("/api/v1/logs", routes_1.auditLogsRoutes);
app.use("/api/v1/settings", routes_1.settingsRoutes);
app.use("/api/v1/inventory", routes_1.inventoryRoutes);
app.use("/api/v1/reports", routes_1.reportRoutes);
app.use("/api/v1/dashboard", routes_1.dashboardRoutes);
app.use("/api/v1/backups", routes_1.backupRoutes);
app.use("/api/v1/webhooks", routes_1.webhookRoutes);
app.use("/api/v1/notifications", routes_1.notificationRoutes);
// webhook for the telegram bot
telegram_service_1.default.setWebHook(`${process.env.APP_URL}/api/v1/webhooks/telegram`);
// global error handler (must be after routes)
app.use(error_middlware_1.globalErrorHandler);
// starting a server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
