import type { Response } from "express";

import config from "../config";
import type { Milliseconds } from "./timeHelper";

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

const isProduction = config.node_env === "production";

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  path: "/",
};

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
  { cookieKey, keyValue, maxAge }: CookieResponse,
): Response => {
  res.cookie(cookieKey, keyValue, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge,
  });

  return res;
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie("session_token", AUTH_COOKIE_OPTIONS);
  res.clearCookie("accessToken", AUTH_COOKIE_OPTIONS);
  res.clearCookie("refreshToken", AUTH_COOKIE_OPTIONS);
};