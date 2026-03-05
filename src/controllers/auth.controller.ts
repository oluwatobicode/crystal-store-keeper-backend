import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import User from "../models/User";
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  USER_MESSAGES,
  HTTP_STATUS,
} from "../config";
import { sendSuccess } from "../utils/response";
import { signToken } from "../utils/token";
import { IRole } from "../types/role.types";
import Business from "../models/Business";
import Role from "../models/Role";

// sign up
export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      businessName,
      businessEmail,
      businessPhone,
      businessAddress,
      businessLogo,
      ownerFullname,
      ownerUsername,
      ownerEmail,
      ownerPassword,
      ownerPhone,
    } = req.body;

    if (!businessName || !businessEmail || !businessPhone || !businessAddress) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.REQUIRED_FIELD("All fields are required"),
      );
    }

    const existingBusiness = await Business.findOne({ businessEmail });
    if (existingBusiness) {
      throw new AppError(400, "Business already exists");
    }

    const newBusiness = await Business.create({
      businessName,
      businessEmail,
      businessPhone,
      businessAddress,
      businessLogo,
    });

    const findRole = await Role.findOne({ roleName: "Admin" });

    if (!findRole) {
      throw new AppError(404, "Role not found");
    }

    const existingUser = await User.findOne({ email: ownerEmail });

    if (existingUser) {
      throw new AppError(400, "A user with this email already exists");
    }

    const newOwner = await User.create({
      email: ownerEmail,
      fullname: ownerFullname,
      username: ownerUsername,
      password: ownerPassword,
      contactNumber: ownerPhone,
      role: findRole._id,
    });

    const updatedBusiness = await Business.findByIdAndUpdate(
      newBusiness._id,
      { owner: newOwner._id },
      { new: true },
    );

    if (!updatedBusiness) {
      throw new AppError(500, "Failed to update business with owner");
    }

    const token = signToken(
      newBusiness._id.toString(),
      newBusiness.businessEmail,
      findRole.roleName,
    );

    return sendSuccess(res, 200, SUCCESS_MESSAGES.SIGNUP_SUCCESS, {
      updatedBusiness,
      token,
    });
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
