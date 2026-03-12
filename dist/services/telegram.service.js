"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const Setting_1 = __importDefault(require("../models/Setting"));
const ai_service_1 = require("./ai.service");
const token = process.env.TELEGRAM_BOT_TOKEN;
// polling = no webhook needed during development
const bot = new node_telegram_bot_api_1.default(token, { webHook: true });
console.log("🤖 Telegram bot is running...");
//  HELPER: send typing indicator
const sendTyping = (chatId) => {
    bot.sendChatAction(chatId, "typing");
};
//  HELPER: format error message
const sendError = async (chatId, message) => {
    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
};
//  CONNECT COMMAND
// store owner sends their connect code to link their business to this chat
// e.g. /connect CRYSTAL-a3f9b2
bot.onText(/\/connect (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const connectCode = match?.[1]?.trim();
    if (!connectCode) {
        return sendError(chatId, "Please provide your connect code. e.g. `/connect CRYSTAL-a3f9b2`");
    }
    try {
        sendTyping(chatId);
        // find the business with this connect code in settings
        const settings = await Setting_1.default.findOne({
            "telegram.connectCode": connectCode,
        });
        if (!settings) {
            return sendError(chatId, "❌ Invalid connect code. Please check and try again.");
        }
        // check if already connected
        if (settings.telegram?.connected) {
            return sendError(chatId, "✅ This store is already connected to Telegram.");
        }
        // link this chatId to the business
        await Setting_1.default.findOneAndUpdate({ "telegram.connectCode": connectCode }, {
            "telegram.connected": true,
            "telegram.chatId": chatId,
            "telegram.connectedAt": new Date(),
        });
        await bot.sendMessage(chatId, `✅ *Store connected successfully!*\n\nYou can now ask me anything about your store.\n\nTry asking:\n• "How much did we make today?"\n• "Which products are low on stock?"\n• "Show me recent transactions"`, { parse_mode: "Markdown" });
    }
    catch (error) {
        console.error("Connect error:", error);
        return sendError(chatId, "Something went wrong. Please try again.");
    }
});
//  START COMMAND
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, `👋 *Welcome to Crystal Store Keeper Bot!*\n\nI can give you real-time insights about your store.\n\nTo get started, connect your store by sending your connect code:\n\`/connect YOUR-CODE\`\n\nGet your connect code from *Settings → Integrations → Telegram* in your Crystal Store Keeper dashboard.`, { parse_mode: "Markdown" });
});
//  DISCONNECT COMMAND
bot.onText(/\/disconnect/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const settings = await Setting_1.default.findOne({ "telegram.chatId": chatId });
        if (!settings || !settings.telegram?.connected) {
            return sendError(chatId, "No store is connected to this chat.");
        }
        await Setting_1.default.findOneAndUpdate({ "telegram.chatId": chatId }, {
            "telegram.connected": false,
            "telegram.chatId": null,
            "telegram.connectedAt": null,
        });
        await bot.sendMessage(chatId, "✅ Store disconnected successfully.");
    }
    catch (error) {
        console.error("Disconnect error:", error);
        return sendError(chatId, "Something went wrong. Please try again.");
    }
});
//  HELP COMMAND
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, `*What can I help you with?*\n\n📊 *Sales*\n• "How much did we make today?"\n• "Show me this week's sales"\n• "What's our revenue this month?"\n\n📦 *Inventory*\n• "Which products are low on stock?"\n• "How many units of [product] do we have?"\n\n🏆 *Products*\n• "What are our top selling products?"\n• "Best sellers this week"\n\n💰 *Payments*\n• "Show pending payments"\n• "Payment method breakdown this month"\n\n👤 *Customers*\n• "Look up customer [name or phone]"\n\n🧾 *Transactions*\n• "Show recent transactions"\n\n*Commands*\n/connect - Connect your store\n/disconnect - Disconnect your store\n/help - Show this message`, { parse_mode: "Markdown" });
});
//  MAIN MESSAGE HANDLER
// handles all regular text messages (not commands)
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    // ignore commands — they're handled above
    if (!text || text.startsWith("/"))
        return;
    try {
        // 1. check if this chat has a connected business
        const settings = await Setting_1.default.findOne({
            "telegram.chatId": chatId,
            "telegram.connected": true,
        });
        if (!settings) {
            return sendError(chatId, "⚠️ No store connected to this chat.\n\nUse `/connect YOUR-CODE` to connect your store.");
        }
        const businessId = settings.businessId.toString();
        // 2. show typing indicator while processing
        const typingInterval = setInterval(() => {
            bot.sendChatAction(chatId, "typing");
        }, 4000);
        // 3. process message through AI
        const response = await (0, ai_service_1.processMessage)({
            businessId,
            chatId,
            message: text,
        });
        clearInterval(typingInterval);
        // 4. send response back
        await bot.sendMessage(chatId, response);
    }
    catch (error) {
        console.error("Message handler error:", error);
        await sendError(chatId, "Sorry, something went wrong. Please try again.");
    }
});
//  ERROR HANDLER
bot.on("polling_error", (error) => {
    console.error("Telegram polling error:", error);
});
exports.default = bot;
