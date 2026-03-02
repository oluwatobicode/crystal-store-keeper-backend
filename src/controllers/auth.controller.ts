import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import User from "../models/User";
import { ERROR_MESSAGES, SUCCESS_MESSAGES, USER_MESSAGES } from "../config";
import { sendSuccess } from "../utils/response";
import { signToken } from "../utils/token";
import { IRole } from "../types/role.types";

// sign up
export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
  } catch (error) {
    next(error);
  }
};

// log in
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .select("+password")
      .populate<{ role: IRole }>("role");

    if (!user) {
      throw new AppError(401, USER_MESSAGES.NOT_FOUND);
    }

    // checking if the password is correct
    if (!(await user.correctPassword(password))) {
      throw new AppError(401, USER_MESSAGES.INVALID_CREDENTIALS);
    }

    // return jwt
    const token = signToken(
      user._id.toString(),
      user.email,
      user.role.roleName,
    );

    return sendSuccess(res, 200, SUCCESS_MESSAGES.LOGIN_SUCCESS, {
      token,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// log out
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    return sendSuccess(res, 200, "Logged out successfully", {});
  } catch (error) {
    console.log(error);
    next(error);
  }
};
