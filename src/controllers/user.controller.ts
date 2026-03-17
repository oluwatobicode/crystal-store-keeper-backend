import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS, USER_MESSAGES } from "../config";
import { sendError, sendSuccess } from "../utils/response";
import User from "../models/User";
import Business from "../models/Business";
import { logAudit } from "../utils/auditLog";
import { inviteUserEmail } from "../utils/email";
import { config } from "../config/app.config";
import { uploadProfilePicture } from "../utils/cloudinary";

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
      isVerified: true,
    });

    await logAudit(
      req.user!._id,
      req.user!.fullname,
      "CREATE_USER",
      `Created user: ${newUser.fullname}`,
      "users",
      businessId,
    );

    // Send invitation email to the newly created user
    try {
      const business = await Business.findById(businessId);
      const loginUrl = `${config.frontendUrl}/login`;

      await inviteUserEmail(
        newUser.email,
        newUser.fullname,
        req.user!.fullname,
        business?.businessName ?? "Crystal Store Keeper",
        loginUrl,
      );
    } catch (emailError) {
      console.error("Failed to send invite email:", emailError);
      // Non-blocking — user is already created, don't fail the request
    }

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

    const users = await User.find({ businessId })
      .populate("role")
      .sort({ createdAt: -1 });

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

export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;
    const { id } = req.params;

    const user = await User.findOne({ _id: id, businessId });
    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
    }

    if (!req.file) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "No image file provided");
    }

    const result = await uploadProfilePicture(
      req.file.buffer,
      id as string,
      businessId.toString(),
    );

    user.avatarUrl = result.secure_url;
    await user.save();

    return sendSuccess(res, HTTP_STATUS.OK, "Avatar updated successfully", {
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return next(error);
  }
};

// Self-service: logged-in user uploads their own profile picture
export const uploadOwnAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!._id.toString();
    const businessId = req.businessId!;

    const user = await User.findOne({ _id: userId, businessId });
    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
    }

    if (!req.file) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "No image file provided");
    }

    const result = await uploadProfilePicture(
      req.file.buffer,
      userId,
      businessId.toString(),
    );

    user.avatarUrl = result.secure_url;
    await user.save();

    return sendSuccess(res, HTTP_STATUS.OK, "Avatar updated successfully", {
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    console.error("Upload own avatar error:", error);
    return next(error);
  }
};

// GET /me — return the logged-in user's own profile
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await User.findById(req.user!._id).populate("role");

    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
    }

    return sendSuccess(res, HTTP_STATUS.OK, "Profile fetched successfully", {
      fullName: user.fullname,
      contactNumber: user.contactNumber,
      avatarUrl: user.avatarUrl,
      status: user.status,
      role: user.role,
      _id: user._id,
    });
  } catch (error) {
    console.error("Get me error:", error);
    return next(error);
  }
};

// PATCH /me — update own profile (name + contact only — no role/status changes)
export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // whitelist only safe fields — users cannot elevate their own role, status etc.
    const { fullname, contactNumber } = req.body;

    if (!fullname && !contactNumber) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Provide at least one field to update (fullname or contactNumber)",
      );
    }

    const allowedUpdates: Record<string, string> = {};
    if (fullname) allowedUpdates.fullname = fullname;
    if (contactNumber) allowedUpdates.contactNumber = contactNumber;

    const updatedUser = await User.findByIdAndUpdate(
      req.user!._id,
      allowedUpdates,
      { new: true, runValidators: true },
    ).populate("role");

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Profile updated successfully",
      updatedUser,
    );
  } catch (error) {
    console.error("Update me error:", error);
    return next(error);
  }
};
