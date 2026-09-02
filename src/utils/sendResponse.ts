import type { Response } from "express";
import type { Milliseconds } from "./timeHelper";
import config from "../config";

interface CookieResponse {
  cookieKey: string;
  keyValue: string;
  maxAge: Milliseconds;
}
interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

interface SendResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  meta?: Meta;
}

export const sendResponse = <T>(
  res: Response,
  response: SendResponse<T>,
): Response => {
  const { success, message, statusCode, data, meta } = response;

  return res.status(statusCode).json({
    success,
    message,
    timestamp: new Date().toISOString(),
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
  });
};

export const sendResponseToCookies = (
  res: Response,
  response: CookieResponse,
): Response => {
  const { cookieKey, keyValue, maxAge } = response;

  return res.cookie(cookieKey, keyValue, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: config.node_env === "production" ? "none" : "lax",
    maxAge,
    path: "/",
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: config.node_env === "production" ? "none" : "lax",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: config.node_env === "production" ? "none" : "lax",
    path: "/",
  });
};
