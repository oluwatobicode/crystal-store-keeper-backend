import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import { AppError } from "../utils/AppError";
import User from "../models/User";
import Role from "../models/Role";
import Business from "../models/Business";
import Setting from "../models/Setting";
import { HTTP_STATUS, SUCCESS_MESSAGES, config } from "../config";
import { sendSuccess } from "../utils/response";
import { signToken, blacklistToken } from "../utils/token";
import { IRole } from "../types/role.types";
import { generateOtp } from "../utils/otp";
import {
  sendOtpEmail,
  sendResetPasswordEmail,
  welcomeEmail,
} from "../utils/email";

// admin role seeded automatically for every new business
const ADMIN_ROLE = {
  roleName: "Admin",
  description: "Full access to everything",
  permissions: [
    "dashboard.view",
    "pos.operate",
    "pos.discount.small",
    "pos.discount.large",
    "pos.refund",
    "customers.view",
    "customers.manage",
    "customer.history",
    "transactions.view",
    "transactions.view.one",
    "transactions.reconcile",
    "transactions.mange.payments",
    "inventory.view",
    "inventory.receive",
    "inventory.adjust",
    "inventory.manage",
    "reports.view",
    "reports.export",
    "reports.profit",
    "users.manage",
    "user.roles",
    "user.activity",
    "settings.manage",
    "audit.view",
    "backup.manage",
  ],
  isDefault: true,
};

//  SIGN UP

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      businessName,
      businessEmail,
      businessPhone,
      businessAddress,
      ownerFullname,
      ownerUsername,
      ownerEmail,
      ownerPassword,
      ownerPhone,
    } = req.body;

    if (
      !businessName ||
      !businessEmail ||
      !businessPhone ||
      !businessAddress ||
      !ownerFullname ||
      !ownerUsername ||
      !ownerEmail ||
      !ownerPassword ||
      !ownerPhone
    ) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, "All fields are required");
    }

    const existingBusiness = await Business.findOne({ businessEmail }).session(
      session,
    );
    if (existingBusiness) {
      throw new AppError(
        HTTP_STATUS.CONFLICT,
        "A business with this email already exists",
      );
    }

    const existingUser = await User.findOne({ email: ownerEmail }).session(
      session,
    );
    if (existingUser) {
      throw new AppError(
        HTTP_STATUS.CONFLICT,
        "A user with this email already exists",
      );
    }

    // 1. create the business
    const [business] = await Business.create(
      [{ businessName, businessEmail, businessPhone, businessAddress }],
      { session },
    );

    // 2. seed the admin role for this business
    const [adminRole] = await Role.create(
      [{ ...ADMIN_ROLE, businessId: business._id }],
      { session },
    );

    // 3. generate OTP for email verification
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 4. create the owner user
    const [owner] = await User.create(
      [
        {
          email: ownerEmail,
          fullname: ownerFullname,
          username: ownerUsername,
          password: ownerPassword,
          contactNumber: ownerPhone,
          role: adminRole._id,
          businessId: business._id,
          mustChangePassword: false,
          otp,
          otpExpiry: otpExpires,
        },
      ],
      { session },
    );

    // 5. link owner back to business
    await Business.findByIdAndUpdate(
      business._id,
      { owner: owner._id },
      { session },
    );

    // 6. seed default settings for this business
    await Setting.create(
      [
        {
          businessId: business._id,
          business: {
            storeName: businessName,
            address: businessAddress,
            phone: businessPhone,
            email: businessEmail,
            logoUrl: null,
          },
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    // 7. send OTP email (fire-and-forget, don't block response)
    sendOtpEmail(owner.email, owner.fullname, otp).catch(console.error);

    // 8. sign token
    const token = signToken(
      owner._id.toString(),
      owner.email,
      adminRole.roleName,
      adminRole.permissions,
      business._id.toString(),
    );

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      SUCCESS_MESSAGES.SIGNUP_SUCCESS,
      {
        business: {
          _id: business._id,
          businessName: business.businessName,
          businessEmail: business.businessEmail,
        },
        owner: {
          _id: owner._id,
          fullname: owner.fullname,
          email: owner.email,
          username: owner.username,
        },
        token,
      },
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

//  LOGIN

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        "Email and password are required",
      );
    }

    const user = await User.findOne({ email })
      .select("+password")
      .populate<{ role: IRole }>("role");

    if (!user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, "Invalid credentials");
    }

    if (!(await user.correctPassword(password))) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, "Invalid credentials");
    }

    if (!user.isVerified) {
      throw new AppError(
        HTTP_STATUS.UNAUTHORIZED,
        "Please verify your email before logging in",
      );
    }

    if (user.status !== "active") {
      throw new AppError(
        HTTP_STATUS.UNAUTHORIZED,
        "Your account has been deactivated. Contact your admin",
      );
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = signToken(
      user._id.toString(),
      user.email,
      user.role.roleName,
      user.role.permissions,
      user.businessId.toString(),
    );

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LOGIN_SUCCESS, {
      token,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        username: user.username,
        mustChangePassword: user.mustChangePassword,
        role: {
          _id: user.role._id,
          roleName: user.role.roleName,
          permission: user.role.permissions,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

//  LOGOUT

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      await blacklistToken(token);
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.LOGOUT_SUCCESS,
      null,
    );
  } catch (error) {
    next(error);
  }
};

//  VERIFY OTP

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, "Email and OTP are required");
    }

    const user = await User.findOne({ email }).select("+otp +otpExpiry");

    if (!user) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    if (user.isVerified) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, "User is already verified");
    }

    if (!user.otp || !user.otpExpiry) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        "No OTP found. Please request a new one",
      );
    }

    if (user.otpExpiry < new Date()) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        "OTP has expired. Please request a new one",
      );
    }

    if (user.otp !== otp) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, "Invalid OTP");
    }

    // mark verified and clear OTP fields
    await User.findByIdAndUpdate(user._id, {
      isVerified: true,
      otp: null,
      otpExpiry: null,
    });

    welcomeEmail(
      user.email,
      user.fullname,
      `${process.env.FRONTEND_URL}/dashboard`,
    ).catch(console.error);

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.OTP_VERIFIED,
      null,
    );
  } catch (error) {
    next(error);
  }
};

//  RESEND OTP

export const resendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, "Email is required");
    }

    const user = await User.findOne({ email });

    if (!user) {
      // don't reveal whether email exists
      return sendSuccess(
        res,
        HTTP_STATUS.OK,
        SUCCESS_MESSAGES.OTP_RESENT,
        null,
      );
    }

    if (user.isVerified) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, "User is already verified");
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, { otp, otpExpiry });

    sendOtpEmail(user.email, user.fullname, otp).catch(console.error);

    return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.OTP_RESENT, null);
  } catch (error) {
    next(error);
  }
};

// SEND PASSWORD RESET LINK

export const sendPasswordResetLink = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, "Email is required");
    }

    // always return success — never reveal whether email exists
    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      return sendSuccess(
        res,
        HTTP_STATUS.OK,
        SUCCESS_MESSAGES.PASSWORD_RESET_LINK_SENT,
        null,
      );
    }

    // generate a secure random token (NOT a JWT)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await User.findByIdAndUpdate(user._id, { resetToken, resetTokenExpiry });

    const resetLink = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    sendResetPasswordEmail(user.email, user.fullname, resetLink).catch(
      console.error,
    );

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      SUCCESS_MESSAGES.PASSWORD_RESET_LINK_SENT,
      null,
    );
  } catch (error) {
    next(error);
  }
};

// RESET PASSWORD

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        "Token and new password are required",
      );
    }

    if (newPassword.length < 8) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        "Password must be at least 8 characters",
      );
    }

    // find user with this token that hasn't expired
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    }).select("+resetToken +resetTokenExpiry");

    if (!user) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid or expired reset link",
      );
    }

    // update password and clear reset token fields
    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    user.mustChangePassword = false;
    await user.save(); // triggers the bcrypt pre-save hook

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Password reset successfully. Please log in",
      null,
    );
  } catch (error) {
    next(error);
  }
};

//  CHANGE PASSWORD (logged in user)

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        "Current password and new password are required",
      );
    }

    if (newPassword.length < 8) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        "New password must be at least 8 characters",
      );
    }

    if (currentPassword === newPassword) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        "New password must be different from current password",
      );
    }

    const user = await User.findById(req.user!._id).select("+password");

    if (!user) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    const isCorrect = await user.correctPassword(currentPassword);
    if (!isCorrect) {
      throw new AppError(
        HTTP_STATUS.UNAUTHORIZED,
        "Current password is incorrect",
      );
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Password changed successfully",
      null,
    );
  } catch (error) {
    next(error);
  }
};
