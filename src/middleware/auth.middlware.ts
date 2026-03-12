import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { ERROR_MESSAGES, USER_MESSAGES } from "../config";
import { verifyToken, isTokenBlacklisted } from "../utils/token";
import User from "../models/User";
import { IRole, Permission } from "../types/role.types";

export const protectRoutes = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1. Get token from headers
    const token = req.headers.authorization;

    // 2. Check if token exists
    if (!token || !token.startsWith("Bearer ")) {
      throw new AppError(401, USER_MESSAGES.INVALID_CREDENTIALS);
    }

    const rawToken = token.split(" ")[1];

    // 3. Check if token has been blacklisted (user logged out)
    if (await isTokenBlacklisted(rawToken)) {
      throw new AppError(
        401,
        "Token has been invalidated, please log in again",
      );
    }

    // 4. Verify token
    const decodedToken = verifyToken(rawToken);

    // 5. Check if user exists
    const user = await User.findById(decodedToken.userId).populate("role");

    // 6. Check if user is valid
    if (!user) {
      throw new AppError(401, USER_MESSAGES.NOT_FOUND);
    }

    // 7. Attach user to request
    req.user = user;
    req.businessId = decodedToken.businessId;

    // 8. Move to next middleware
    next();
  } catch (error) {
    next(error);
  }
};

// factory function — returns a middleware that checks for a specific permission
export const authorize = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, ERROR_MESSAGES.NOT_LOGGED_IN);
      }

      // role is populated by protectRoutes, cast it to IRole to access permissions
      const role = req.user.role as unknown as IRole;

      if (!role.permissions.includes(permission)) {
        throw new AppError(
          403,
          "You do not have permission to perform this action",
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
