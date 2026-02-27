import { NextFunction, Request, Response } from "express";
import { ERROR_MESSAGES, HTTP_STATUS, USER_MESSAGES } from "../config";
import { sendError, sendSuccess } from "../utils/response";
import User from "../models/User";
import { logAudit } from "../utils/auditLog";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { fullname, username, password, role, contactNumber } = req.body;

    if (!fullname || !username || !password || !role || !contactNumber) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        USER_MESSAGES.MISSING_FIELDS,
      );
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT,
        USER_MESSAGES.DUPLICATE_USERNAME,
      );
    }

    const newUser = await User.create({
      ...req.body,
      mustChangePassword: true,
    });

    await logAudit(
      null,
      "System",
      "CREATE_USER",
      `Created User: ${newUser.fullname}`,
      "users",
    );

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      USER_MESSAGES.CREATED,
      newUser,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
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
  } catch (error) {
    // eslint-disable-next-line no-console
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
    const user = await User.findById(req.params.id).populate("role");

    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
    }

    const updateUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await logAudit(
      null,
      "System",
      "UPDATE_USER",
      `Updated User: ${updateUser?.fullname}`,
      "users",
    );

    return sendSuccess(res, HTTP_STATUS.OK, USER_MESSAGES.UPDATED, updateUser);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Update user error:", error);
    return next(error);
  }
};
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await User.find().populate("role");

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      users.length > 0 ? USER_MESSAGES.FETCHED : USER_MESSAGES.NOT_FOUND,
      users,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
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
    const user = await User.findById(req.params.id).populate("role");

    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
    }

    return sendSuccess(res, HTTP_STATUS.OK, USER_MESSAGES.FETCHED_ONE, user);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get user error:", error);
    return next(error);
  }
};
