import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";
import { getSessionByToken } from "../modules/auth/auth.service";
import type { UserRole } from "../modules/auth/auth.schema";
const SESSION_COOKIE_NAME = "session_token";

const getSessionToken = (req: Request): string | null => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token || typeof token !== "string") {
    return null;
  }

  return token;
};

// Authenticate request using database session
export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = getSessionToken(req);

    if (!token) {
      throw new AppError("Please login first", 401);
    }

    const auth = await getSessionByToken(token);

    if (!auth) {
      throw new AppError("Invalid or expired session", 401);
    }

    req.auth = auth;
    req.user = auth.user;

    next();
  } catch (error) {
    next(error);
  }
};

// Authenticate when a session exists,
// but allow unauthenticated requests.
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = getSessionToken(req);

    if (!token) {
      next();
      return;
    }

    const auth = await getSessionByToken(token);

    if (auth) {
      req.auth = auth;
      req.user = auth.user;
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Require verified email
export const requireVerifiedEmail = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    if (!req.auth?.user) {
      throw new AppError("Please login first", 401);
    }

    if (!req.auth.user.emailVerified) {
      throw new AppError("Please verify your email first", 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Require active/non-banned user
export const requireActiveUser = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    if (!req.auth?.user) {
      throw new AppError("Please login first", 401);
    }

    if (req.auth.user.banned) {
      throw new AppError("Your account has been banned", 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Require specific role
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.auth?.user) {
        throw new AppError("Please login first", 401);
      }

      if (!allowedRoles.includes(req.auth.user.role)) {
        throw new AppError(
          "You do not have permission to access this resource",
          403,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireAdmin = requireRole("admin");
export const requireModerator = requireRole("moderator", "admin");
export const requireDonor = requireRole("donor");
export const requireRecipient = requireRole("recipient");
export const requireVolunteer = requireRole("volunteer");
export const requireHospital = requireRole("hospital");
export const requireBloodBank = requireRole("blood_bank");
export const requireHospitalOrBloodBank = requireRole("hospital", "blood_bank");
