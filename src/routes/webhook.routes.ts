import express from "express";
import { handleTelegramWebhook } from "../controllers/webhook.controller";

const router = express.Router();

router.post("/telegram", handleTelegramWebhook);

export default router;
