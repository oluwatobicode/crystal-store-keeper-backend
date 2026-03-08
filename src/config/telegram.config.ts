import TelegramBot from "node-telegram-bot-api";
import { config } from "./app.config";
import { defaultMaxListeners } from "events";

const token = config.telegramApiKey;

const bot = new TelegramBot(token, { polling: true });

export default bot;
