import jwt from "jsonwebtoken";
import { config } from "../config/app.config";
import { AppError } from "./AppError";
import { USER_MESSAGES } from "../config";
import Blacklist from "../models/Blacklist";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  businessId: string;
}

export const signToken = (
  userId: string,
  email: string,
  fullname: string,
  username: string,
  role: string,
  permissions: string[],
  businessId: string,
): string => {
  return jwt.sign(
    { userId, email, role, permissions, businessId, fullname, username },
    config.jwtSecret as jwt.Secret,
    { expiresIn: "7d" } as jwt.SignOptions,
  );
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, config.jwtSecret as jwt.Secret) as TokenPayload;
  } catch (error) {
    throw new AppError(401, USER_MESSAGES.INVALID_CREDENTIALS);
  }
};

export const generateRefreshToken = () => {};

/**
 * Blacklist a JWT so it can no longer be used.
 * The token is stored in the Blacklist collection with its expiry,
 * and MongoDB's TTL index auto-cleans it once expired.
 */
export const blacklistToken = async (token: string): Promise<void> => {
  const decoded = jwt.decode(token) as { exp: number } | null;

  if (!decoded || !decoded.exp) {
    throw new AppError(401, USER_MESSAGES.INVALID_CREDENTIALS);
  }

  const expiresAt = new Date(decoded.exp * 1000);

  await Blacklist.create({ token, expiresAt });
};

// Check if a token has been blacklisted (i.e. user logged out).

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const entry = await Blacklist.findOne({ token });
  return !!entry;
};
