import jwt from "jsonwebtoken";
import { config } from "../config/app.config";

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

export const generateToken = () => {};
export const verifyToken = () => {};
export const generateRefreshToken = () => {};
