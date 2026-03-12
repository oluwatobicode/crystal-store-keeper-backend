"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTelegramWebhook = void 0;
const telegram_service_1 = __importDefault(require("../services/telegram.service"));
const handleTelegramWebhook = (req, res) => {
    telegram_service_1.default.processUpdate(req.body);
    res.sendStatus(200);
};
exports.handleTelegramWebhook = handleTelegramWebhook;
