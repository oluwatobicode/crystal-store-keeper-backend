import { NextFunction, Request, Response } from "express";
import Setting from "../models/Setting";
import { sendError, sendSuccess } from "../utils/response";
import { BUSINESS_MESSAGES, ERROR_MESSAGES, HTTP_STATUS } from "../config";
import { logAudit } from "../utils/auditLog";
import { IRole } from "../types/role.types";
import crypto from "crypto";

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

    // Derive a `pos` block so the POS can pre-validate discounts:
    // - discountThreshold: small/large boundary (%)
    // - discountPermission: the current user's discount tier
    // - maxDiscountPercent: highest discount this user may apply (%)
    const role = req.user!.role as unknown as IRole;
    const permissions = role?.permissions || [];
    const discountThreshold =
      settings.system.managerApprovalDiscountThreshold ?? 15;

    const discountPermission: "large" | "small" | "none" =
      permissions.includes("pos.discount.large")
        ? "large"
        : permissions.includes("pos.discount.small")
          ? "small"
          : "none";

    const maxDiscountPercent =
      discountPermission === "large"
        ? 100
        : discountPermission === "small"
          ? discountThreshold
          : 0;

    return sendSuccess(res, HTTP_STATUS.OK, BUSINESS_MESSAGES.FETCHED, {
      ...settings.toObject(),
      pos: {
        discountThreshold,
        discountPermission,
        maxDiscountPercent,
      },
    });
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

export const generateTelegramCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const businessId = req.businessId!;
  const connectCode = `CRYSTAL-${crypto.randomBytes(3).toString("hex")}`;

  await Setting.findOneAndUpdate(
    { businessId },
    { "telegram.connectCode": connectCode, "telegram.connected": false },
  );

  return sendSuccess(res, HTTP_STATUS.OK, "Connect code generated", {
    connectCode,
  });
};
