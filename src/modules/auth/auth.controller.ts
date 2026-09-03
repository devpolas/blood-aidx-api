import type { NextFunction, Request, Response } from "express";

import passport from "passport";

import config from "../../config";

import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ResendVerificationSchema,
  SignUpSchema,
  VerifyEmailSchema,
} from "./auth.schema";

import {
  changePassword,
  createAuthTokens,
  createPasswordResetToken,
  createSession,
  resendVerification,
  generateFreshAccessToken,
  logout,
  logoutAll,
  revokeOtherSessions,
  resetPassword,
  signup,
  verifyAccountPassword,
  verifyEmail,
} from "./auth.service";

import { Time } from "../../utils/timeHelper";

import { catchAsync } from "../../utils/catchAsync";

import {
  clearAuthCookies,
  sendResponse,
  sendResponseToCookies,
} from "../../utils/sendResponse";

import { AppError } from "../../utils/appError";

// ============================================================
// Constants
// ============================================================

const SESSION_COOKIE_NAME = "session_token";

const ACCESS_TOKEN_COOKIE_NAME = "accessToken";

const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

const SESSION_MAX_AGE = Time.day(config.auth_session_duration_days);

const ACCESS_TOKEN_MAX_AGE = Time.day(1);

const REFRESH_TOKEN_MAX_AGE = Time.day(30);

// ============================================================
// Helpers
// ============================================================

const getClientIp = (req: Request): string | undefined => {
  return req.ip;
};

const getUserAgent = (req: Request): string | undefined => {
  return req.get("user-agent") ?? undefined;
};

const requireAuth = (req: Request) => {
  if (!req.auth?.user || !req.auth.session) {
    throw new AppError("Please login first", 401);
  }

  return {
    user: req.auth.user,
    session: req.auth.session,
  };
};

const getRefreshToken = (req: Request): string => {
  const refreshToken = req.cookies?.refreshToken;

  if (typeof refreshToken !== "string" || !refreshToken.trim()) {
    throw new AppError("Refresh token is required", 401);
  }

  return refreshToken;
};

// ============================================================
// Auth Controller
// ============================================================

export const AuthController = {
  // ==========================================================
  // Signup
  // ==========================================================

  signup: catchAsync(async (req: Request, res: Response) => {
    const data = SignUpSchema.parse(req.body);

    const user = await signup(data);

    sendResponse(res, {
      success: true,
      message: "Account created successfully. Please verify your email.",
      statusCode: 201,
      data: {
        user,
      },
    });
  }),

  // ==========================================================
  // Signin
  // ==========================================================

  signin: (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate(
      "local",
      {
        session: false,
      },
      async (
        error: unknown,
        user: Express.User | false | null,
        info?: {
          message?: string;
        },
      ) => {
        try {
          if (error) {
            next(error);
            return;
          }

          if (!user) {
            throw new AppError(
              info?.message ?? "Invalid email or password",
              401,
            );
          }

          const session = await createSession(
            user.id,
            getClientIp(req),
            getUserAgent(req),
          );

          const tokens = await createAuthTokens(user.id);

          sendResponseToCookies(res, {
            cookieKey: SESSION_COOKIE_NAME,
            keyValue: session.token,
            maxAge: SESSION_MAX_AGE,
          });

          sendResponseToCookies(res, {
            cookieKey: ACCESS_TOKEN_COOKIE_NAME,
            keyValue: tokens.accessToken,
            maxAge: ACCESS_TOKEN_MAX_AGE,
          });

          sendResponseToCookies(res, {
            cookieKey: REFRESH_TOKEN_COOKIE_NAME,
            keyValue: tokens.refreshToken,
            maxAge: REFRESH_TOKEN_MAX_AGE,
          });

          sendResponse(res, {
            success: true,
            message: "Signed in successfully",
            statusCode: 200,
            data: {
              user,
              session: session.session,
            },
          });
        } catch (err) {
          next(err);
        }
      },
    )(req, res, next);
  },

  // ==========================================================
  // Current User
  // ==========================================================

  me: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    sendResponse(res, {
      success: true,
      message: "Authenticated user retrieved successfully",
      statusCode: 200,
      data: {
        user,
      },
    });
  }),

  // ==========================================================
  // Verify Account Password
  // ==========================================================

  verifyPassword: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const password = req.body?.password;

    if (typeof password !== "string" || !password.trim()) {
      throw new AppError("Password is required", 400);
    }

    const isValid = await verifyAccountPassword(user.id, password);

    if (!isValid) {
      throw new AppError("Password is incorrect", 401);
    }

    sendResponse(res, {
      success: true,
      message: "Password verified successfully",
      statusCode: 200,
    });
  }),

  // ==========================================================
  // Fresh Access Token
  // ==========================================================

  freshToken: catchAsync(async (req: Request, res: Response) => {
    const refreshToken = getRefreshToken(req);

    const accessToken = await generateFreshAccessToken(refreshToken);

    sendResponseToCookies(res, {
      cookieKey: ACCESS_TOKEN_COOKIE_NAME,
      keyValue: accessToken,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    sendResponse(res, {
      success: true,
      message: "Access token refreshed successfully",
      statusCode: 200,
    });
  }),

  // ==========================================================
  // Email Verification
  // ==========================================================

  verifyEmail: catchAsync(async (req: Request, res: Response) => {
    const data = VerifyEmailSchema.parse(req.body);

    const user = await verifyEmail(data.email, data.code);

    sendResponse(res, {
      success: true,
      message: "Email verified successfully",
      statusCode: 200,
      data: {
        user,
      },
    });
  }),

  // ==========================================================
  // Resend Verification
  // ==========================================================

  resendVerification: catchAsync(async (req: Request, res: Response) => {
    const data = ResendVerificationSchema.parse(req.body);

    await resendVerification(data.email);

    // Do not reveal whether
    // the email exists.

    sendResponse(res, {
      success: true,
      message:
        "If the account requires verification, a verification code has been sent.",
      statusCode: 200,
    });
  }),

  // ==========================================================
  // Logout Current Session
  // ==========================================================

  logout: catchAsync(async (req: Request, res: Response) => {
    const { user, session } = requireAuth(req);

    await logout(user.id, session.id);

    clearAuthCookies(res);

    sendResponse(res, {
      success: true,
      message: "Logged out successfully",
      statusCode: 200,
    });
  }),

  // ==========================================================
  // Logout All Devices
  // ==========================================================

  logoutAll: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await logoutAll(user.id);

    clearAuthCookies(res);

    sendResponse(res, {
      success: true,
      message: "Logged out from all devices successfully",
      statusCode: 200,
    });
  }),

  // ==========================================================
  // Logout Other Devices
  // ==========================================================

  logoutOtherDevices: catchAsync(async (req: Request, res: Response) => {
    const { user, session } = requireAuth(req);

    await revokeOtherSessions(user.id, session.id);

    sendResponse(res, {
      success: true,
      message: "Logged out from other devices successfully",
      statusCode: 200,
    });
  }),

  // ==========================================================
  // Change Password
  // ==========================================================

  changePassword: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = ChangePasswordSchema.parse(req.body);

    await changePassword(user.id, data);

    clearAuthCookies(res);

    sendResponse(res, {
      success: true,
      message: "Password changed successfully. Please login again.",
      statusCode: 200,
    });
  }),

  // ==========================================================
  // Forgot Password
  // ==========================================================

  forgotPassword: catchAsync(async (req: Request, res: Response) => {
    const data = ForgotPasswordSchema.parse(req.body);

    await createPasswordResetToken(data.email);

    // Do not reveal whether
    // the email exists.

    sendResponse(res, {
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
      statusCode: 200,
    });
  }),

  // ==========================================================
  // Reset Password
  // ==========================================================

  resetPassword: catchAsync(async (req: Request, res: Response) => {
    const data = ResetPasswordSchema.parse(req.body);

    await resetPassword(data);

    clearAuthCookies(res);

    sendResponse(res, {
      success: true,
      message: "Password reset successfully. Please login again.",
      statusCode: 200,
    });
  }),
};
