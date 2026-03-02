import jwt from "jsonwebtoken";
import { config } from "../config/app.config";
import { AppError } from "./AppError";
import { USER_MESSAGES } from "../config";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const signToken = (
  userId: string,
  email: string,
  role: string,
): string => {
  return jwt.sign(
    { userId, email, role },
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

export const generateToken = () => {};

export const generateRefreshToken = () => {};
