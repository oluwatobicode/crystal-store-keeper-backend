"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const db_config_1 = require("./config/db.config");
const routes_1 = require("./routes");
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
(0, db_config_1.connectDb)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// connecting to the db
(0, db_config_1.connectDb)();
// Test route
app.get("/", (req, res) => {
    res.json({
        message: "Crystal Stock Keeper API",
        version: "1.0.0",
        status: "running",
    });
});
// routes
app.use("/api/v1/products", routes_1.productRoutes);
app.use("/api/v1/suppliers", routes_1.supplierRoutes);
app.use("/api/v1/customers", routes_1.customerRoutes);
app.use("/api/v1/roles", routes_1.rolesRoutes);
app.use("/api/v1/users", routes_1.userRoutes);
app.use("/api/v1/logs", routes_1.auditLogsRoutes);
app.use("/api/v1/settings", routes_1.settingsRoutes);
app.use("/api/v1/inventory", routes_1.inventoryRoutes);
app.use("/api/v1/reports", routes_1.reportRoutes);
app.use("/api/v1/dashboard", routes_1.dashboardRoutes);
// global error handler (must be after routes)
app.use(errorHandler_1.errorHandler);
// starting a server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
