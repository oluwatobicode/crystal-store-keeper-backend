import { Response } from "express";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    status: "true",
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  error?: string,
): Response<ApiResponse> => {
  return res.status(statusCode).json({
    status: "false",
    message,
    error: error || undefined,
  });
};
