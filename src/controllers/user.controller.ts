import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS, USER_MESSAGES } from "../config";
import { sendError, sendSuccess } from "../utils/response";
import User from "../models/User";
import { logAudit } from "../utils/auditLog";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;
    const { fullname, username, password, role, contactNumber } = req.body;

    if (!fullname || !username || !password || !role || !contactNumber) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        USER_MESSAGES.MISSING_FIELDS,
      );
    }

    // scoped — check duplicate username within this business only
    const existingUser = await User.findOne({ username, businessId });
    if (existingUser) {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT,
        USER_MESSAGES.DUPLICATE_USERNAME,
      );
    }

    const newUser = await User.create({
      ...req.body,
      businessId,
      mustChangePassword: true,
    });

    await logAudit(
      req.user!._id,
      req.user!.fullname,
      "CREATE_USER",
      `Created user: ${newUser.fullname}`,
      "users",
      businessId,
    );

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      USER_MESSAGES.CREATED,
      newUser,
    );
  } catch (error) {
    console.error("Create user error:", error);
    return next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;

    const user = await User.findOne({ _id: req.params.id, businessId });

    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
    }

    await User.findByIdAndDelete(req.params.id);

    await logAudit(
      req.user!._id,
      req.user!.fullname,
      "DELETE_USER",
      `Deleted user: ${user.fullname}`,
      "users",
      businessId,
    );

    return sendSuccess(res, HTTP_STATUS.OK, USER_MESSAGES.DELETED);
  } catch (error) {
    console.error("Delete user error:", error);
    return next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;

    const user = await User.findOne({ _id: req.params.id, businessId });

    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await logAudit(
      req.user!._id,
      req.user!.fullname,
      "UPDATE_USER",
      `Updated user: ${updatedUser?.fullname}`,
      "users",
      businessId,
    );

    return sendSuccess(res, HTTP_STATUS.OK, USER_MESSAGES.UPDATED, updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    return next(error);
  }
};

export const updateUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;
    const { status } = req.body;

    if (!status || !["active", "inactive", "suspended"].includes(status)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "Invalid status value");
    }

    const user = await User.findOne({ _id: req.params.id, businessId });

    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    await logAudit(
      req.user!._id,
      req.user!.fullname,
      "UPDATE_USER_STATUS",
      `Updated user status: ${user.fullname} → ${status}`,
      "users",
      businessId,
    );

    return sendSuccess(res, HTTP_STATUS.OK, USER_MESSAGES.UPDATED, updatedUser);
  } catch (error) {
    console.error("Update user status error:", error);
    return next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;

    const users = await User.find({ businessId }).populate("role");

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      users.length > 0 ? USER_MESSAGES.FETCHED : "No users found",
      users,
    );
  } catch (error) {
    console.error("Get all users error:", error);
    return next(error);
  }
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;

    const user = await User.findOne({
      _id: req.params.id,
      businessId,
    }).populate("role");

    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
    }

    return sendSuccess(res, HTTP_STATUS.OK, USER_MESSAGES.FETCHED_ONE, user);
  } catch (error) {
    console.error("Get user error:", error);
    return next(error);
  }
};
