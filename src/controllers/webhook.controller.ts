import { Request, Response } from "express";
import bot from "../services/telegram.service";

export const handleTelegramWebhook = (req: Request, res: Response) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
};
