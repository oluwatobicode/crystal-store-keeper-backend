"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = void 0;
const app_config_1 = require("./app.config");
const mongoose_1 = __importDefault(require("mongoose"));
const connectDb = async () => {
    try {
        if (!app_config_1.config.databaseUrl) {
            throw new Error("Database URL is not defined");
        }
        await mongoose_1.default.connect(app_config_1.config.databaseUrl);
        console.log("✅ Database connection successful");
    }
    catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1);
    }
};
exports.connectDb = connectDb;
mongoose_1.default.connection.on("connected", () => {
    console.log("Mongoose connected to DB");
});
mongoose_1.default.connection.on("error", (err) => {
    console.log("Mongoose connection error:", err);
});
mongoose_1.default.connection.on("disconnected", () => {
    console.log("Mongoose disconnected");
});
process.on("SIGINT", async () => {
    await mongoose_1.default.connection.close();
    console.log("Mongoose connection closed due to app termination");
    process.exit(0);
});
