import { NextFunction, Request, Response } from "express";
import Setting from "../models/Setting";
import { sendError, sendSuccess } from "../utils/response";
import { BUSINESS_MESSAGES, ERROR_MESSAGES, HTTP_STATUS } from "../config";
import { logAudit } from "../utils/auditLog";

// this is to get the settings (single document)
export const getBusinessProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;

    const settings = await Setting.findOne({ businessId });

    if (!settings) {
      return sendSuccess(res, HTTP_STATUS.OK, BUSINESS_MESSAGES.NOT_FOUND, {});
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      BUSINESS_MESSAGES.FETCHED,
      settings,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get settings error:", error);
    return next(error);
  }
};

// this is to update settings (upsert — creates if none exists)
export const updateBusinessProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;

    const updatedSettings = await Setting.findOneAndUpdate(
      { businessId },
      req.body,
      {
        new: true,
        upsert: true,
      },
    );

    await logAudit(
      req.user!._id,
      `${req.user!.fullname}`,
      "UPDATE_SETTINGS",
      "Updated business settings",
      "settings",
      businessId,
    );

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      BUSINESS_MESSAGES.UPDATED,
      updatedSettings,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Update settings error:", error);
    return next(error);
  }
};

export const getBackup = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {};

export const restoreBackup = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {};
