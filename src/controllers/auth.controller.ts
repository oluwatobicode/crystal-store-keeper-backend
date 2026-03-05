import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError";
import User from "../models/User";
import Role from "../models/Role";
import Business from "../models/Business";
import Setting from "../models/Setting";
import { HTTP_STATUS, SUCCESS_MESSAGES } from "../config";
import { sendSuccess } from "../utils/response";
import { signToken } from "../utils/token";
import { IRole } from "../types/role.types";

// default roles to seed for every new business
const DEFAULT_ROLES = [
  {
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
  },
  {
    roleName: "Manager",
    description: "Access to everything except user management and settings",
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
      "user.activity",
      "audit.view",
    ],
    isDefault: true,
  },
  {
    roleName: "Cashier",
    description: "Basic POS and inventory viewing only",
    permissions: [
      "dashboard.view",
      "pos.operate",
      "pos.discount.small",
      "transactions.view",
      "customers.view",
      "inventory.view",
    ],
    isDefault: true,
  },
];

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

    // basic validation
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

    // check business email not already taken
    const existingBusiness = await Business.findOne({ businessEmail }).session(
      session,
    );
    if (existingBusiness) {
      throw new AppError(
        HTTP_STATUS.CONFLICT,
        "A business with this email already exists",
      );
    }

    // check owner email not already taken
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
      [
        {
          businessName,
          businessEmail,
          businessPhone,
          businessAddress,
        },
      ],
      { session },
    );

    // 2. seed the 3 default roles for this business
    const seededRoles = await Role.create(
      DEFAULT_ROLES.map((role) => ({
        ...role,
        businessId: business._id,
      })),
      { session, ordered: true },
    );

    // 3. find the admin role from the seeded roles
    const adminRole = seededRoles.find((r) => r.roleName === "Admin");
    if (!adminRole) {
      throw new AppError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Failed to seed roles",
      );
    }

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

    // all good — commit everything
    await session.commitTransaction();
    session.endSession();

    // 7. sign token with businessId
    const token = signToken(
      owner._id.toString(),
      owner.email,
      adminRole.roleName,
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
      throw new AppError(401, "Invalid credentials");
    }

    if (!(await user.correctPassword(password))) {
      throw new AppError(401, "Invalid credentials");
    }

    // update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = signToken(
      user._id.toString(),
      user.email,
      user.role.roleName,
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
      },
    });
  } catch (error) {
    next(error);
  }
};

// log-out
export const logout = (req: Request, res: Response, next: NextFunction) => {
  try {
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
