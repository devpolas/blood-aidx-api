import { db } from "../../prisma/db";

import { deleteCache, getCache, setCache } from "../../lib/redis";
import config from "../../config";
import { otpService } from "./otp.service";
import { comparePassword, hashPassword, toDate } from "./auth.utils";

import type {
  AuthResponse,
  AuthUser,
  ChangePasswordInput,
  ResetPasswordInput,
  SignUpInput,
} from "./auth.schema";

import { AppError } from "../../utils/appError";
import { Time } from "../../utils/timeHelper";
import { createJWT, verifyToken } from "../../utils/jwt";
import { generateToken, hashToken } from "../../utils/token";
import ms from "ms";
import { sendEmail } from "../../utils/sendEmail";

// Constants

const CREDENTIAL_PROVIDER = config.auth_credential_provider;
const SESSION_DURATION = Time.day(config.auth_session_duration_days);
const PASSWORD_RESET_DURATION = Time.minute(
  config.auth_password_reset_duration_minutes,
);

const PASSWORD_RESET_DURATION_SECONDS = PASSWORD_RESET_DURATION / 1000;
const USER_CACHE_DURATION = Time.minute(
  config.auth_user_cache_duration_minutes,
);

const USER_CACHE_DURATION_SECONDS = USER_CACHE_DURATION / 1000;
const REFRESH_TOKEN_DURATION = ms(config.jwt_refresh_expire_in);

// Types

interface PasswordResetCache {
  userId: string;
  tokenHash: string;
}

interface CredentialAccount {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  password: string | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: string | null;
}

interface AuthSession {
  id: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
  impersonatedBy: string | null;
}

// Helpers

const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

const normalizeName = (name: string): string => {
  return name.trim().replace(/\s+/g, " ");
};

const getSessionExpiry = (): string => {
  return new Date(Date.now() + SESSION_DURATION).toISOString();
};

const getRefreshTokenExpiry = (): string => {
  return new Date(Date.now() + REFRESH_TOKEN_DURATION).toISOString();
};

const getPasswordResetKey = (tokenHash: string): string => {
  return `password-reset:${tokenHash}`;
};

const getUserCacheKey = (userId: string): string => {
  return `user:cache:${userId}`;
};

const toAuthUser = (user: {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: AuthUser["role"];
  gender: AuthUser["gender"];
  banned: boolean | null;
}): AuthUser => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
    role: user.role,
    gender: user.gender,
    banned: user.banned,
  };
};

const isExpired = (date: Date): boolean => {
  return date.getTime() <= Date.now();
};

const assertValidUser = (user: AuthUser | null): AuthUser => {
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.banned) {
    throw new AppError("Your account has been banned", 403);
  }

  return user;
};

// User Cache

export const cacheUser = async (user: AuthUser): Promise<void> => {
  await setCache(getUserCacheKey(user.id), user, USER_CACHE_DURATION_SECONDS);
};

export const getCachedUser = async (
  userId: string,
): Promise<AuthUser | null> => {
  return getCache<AuthUser>(getUserCacheKey(userId));
};

export const removeCachedUser = async (userId: string): Promise<void> => {
  await deleteCache(getUserCacheKey(userId));
};

export const refreshCachedUser = async (user: AuthUser): Promise<void> => {
  await cacheUser(user);
};

// User

// Get user by email
export const getUserByEmail = async (
  email: string,
): Promise<AuthUser | null> => {
  const normalizedEmail = normalizeEmail(email);

  const user = await db.orm.public.User.where({
    email: normalizedEmail,
  }).first();

  if (!user) {
    return null;
  }

  return toAuthUser(user);
};

// Get user by ID
export const getUserById = async (userId: string): Promise<AuthUser | null> => {
  const cachedUser = await getCachedUser(userId);

  if (cachedUser) {
    return cachedUser;
  }

  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    return null;
  }

  const authUser = toAuthUser(user);

  await cacheUser(authUser);

  return authUser;
};

// Get fresh user directly from database
export const getFreshUserById = async (
  userId: string,
): Promise<AuthUser | null> => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    return null;
  }

  return toAuthUser(user);
};

// Account

// Get credential account
export const getCredentialAccount = async (
  userId: string,
): Promise<CredentialAccount | null> => {
  const account = await db.orm.public.Account.where({
    userId,
    providerId: CREDENTIAL_PROVIDER,
  }).first();

  if (!account) {
    return null;
  }

  return {
    id: account.id,
    accountId: account.accountId,
    providerId: account.providerId,
    userId: account.userId,
    password: account.password,
    refreshToken: account.refreshToken,
    refreshTokenExpiresAt: account.refreshTokenExpiresAt
      ? account.refreshTokenExpiresAt.toString()
      : null,
  };
};

// Signup

export const signup = async (data: SignUpInput): Promise<AuthUser> => {
  const email = normalizeEmail(data.email);

  const name = normalizeName(data.name);

  if (!name) {
    throw new AppError("Name is required", 400);
  }

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const hashedPassword = await hashPassword(data.password);

  let user;

  try {
    user = await db.transaction(async (tx) => {
      const newUser = await tx.orm.public.User.create({
        name,
        email,
        emailVerified: false,
        gender: data.gender ?? null,
        role: data.role,
        image: null,
        banned: false,
        banReason: null,
        banExpires: null,
      });

      await tx.orm.public.Account.create({
        accountId: email,
        providerId: CREDENTIAL_PROVIDER,
        userId: newUser.id,
        password: hashedPassword,
        accessToken: null,
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: null,
      });

      return newUser;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    // PostgreSQL unique constraint protection.
    // This also handles concurrent signup requests.
    if (message.toLowerCase().includes("unique")) {
      throw new AppError("Email is already registered", 409);
    }

    throw error;
  }

  const authUser = toAuthUser(user);

  await removeCachedUser(authUser.id);

  // Generate email verification OTP.
  const otp = await otpService.generateOtp(email);

  await sendEmail({
    to: user.email,
    subject: "Verify your email",
    title: "Verify Your Email Address",
    description:
      "Thank you for joining Blood AidX. Enter the verification code below to verify your email address.",
    verificationCode: otp,
    codeLabel: "Email Verification Code",
    codeExpiresIn: "10 minutes",
    greeting: "🩸 Welcome to the Blood AidX community!",
    showSecurityNotice: false,
  });

  return authUser;
};

// Account Password

// Verify account password
export const verifyAccountPassword = async (
  userId: string,
  password: string,
): Promise<boolean> => {
  const account = await getCredentialAccount(userId);

  if (!account?.password) {
    throw new AppError("Password authentication is not configured", 400);
  }

  return comparePassword(password, account.password);
};

// Change password
export const changePassword = async (
  userId: string,
  data: ChangePasswordInput,
): Promise<void> => {
  const user = await getFreshUserById(userId);

  assertValidUser(user);

  const account = await getCredentialAccount(userId);

  if (!account?.password) {
    throw new AppError("Password authentication is not configured", 400);
  }

  const validPassword = await comparePassword(
    data.currentPassword,
    account.password,
  );

  if (!validPassword) {
    throw new AppError("Current password is incorrect", 401);
  }

  const samePassword = await comparePassword(
    data.newPassword,
    account.password,
  );

  if (samePassword) {
    throw new AppError(
      "New password must be different from your current password",
      400,
    );
  }

  const hashedPassword = await hashPassword(data.newPassword);

  await db.transaction(async (tx) => {
    await tx.orm.public.Account.where({
      id: account.id,
    }).update({
      password: hashedPassword,
      refreshToken: null,
      refreshTokenExpiresAt: null,
    });

    // Password changes invalidate
    // every existing database session.
    await tx.orm.public.Session.where({
      userId,
    }).deleteAll();
  });

  await removeCachedUser(userId);
};

// Session

// Create database session
export const createSession = async (
  userId: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<{
  session: AuthResponse["session"];
  token: string;
}> => {
  const user = await getFreshUserById(userId);

  assertValidUser(user);

  const token = generateToken();

  const tokenHash = hashToken(token);

  const expiresAt = getSessionExpiry();

  const session = await db.orm.public.Session.create({
    token: tokenHash,
    userId,
    expiresAt,
    ipAddress: ipAddress?.trim() || null,
    userAgent: userAgent?.trim() || null,
    impersonatedBy: null,
  });

  return {
    session: {
      id: session.id,
      expiresAt: toDate(session.expiresAt),
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt.toString()),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      userId: session.userId,
      impersonatedBy: session.impersonatedBy,
    },
    token,
  };
};

// Get Session

// Get session by raw session token
export const getSessionByToken = async (
  token: string,
): Promise<{
  user: AuthUser;
  session: NonNullable<AuthResponse["session"]>;
} | null> => {
  if (!token?.trim()) {
    return null;
  }

  const tokenHash = hashToken(token);

  const session = await db.orm.public.Session.where({
    token: tokenHash,
  }).first();

  if (!session) {
    return null;
  }

  const expiresAt = toDate(session.expiresAt);

  if (isExpired(expiresAt)) {
    await db.orm.public.Session.where({
      id: session.id,
    }).delete();

    return null;
  }

  const user = await getFreshUserById(session.userId);

  if (!user || user.banned) {
    await db.orm.public.Session.where({
      id: session.id,
    }).delete();

    await removeCachedUser(session.userId);

    return null;
  }

  return {
    user,
    session: {
      id: session.id,
      expiresAt: toDate(session.expiresAt),
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt.toString()),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      userId: session.userId,
      impersonatedBy: session.impersonatedBy,
    },
  };
};

// Get session by ID
export const getSessionById = async (
  sessionId: string,
): Promise<AuthSession | null> => {
  const session = await db.orm.public.Session.where({
    id: sessionId,
  }).first();

  if (!session) {
    return null;
  }

  return {
    id: session.id,
    expiresAt: toDate(session.expiresAt),
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt.toString()),
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    userId: session.userId,
    impersonatedBy: session.impersonatedBy,
  };
};

// Revoke Session

// Revoke current session
export const revokeSession = async (
  userId: string,
  sessionId: string,
): Promise<void> => {
  const session = await getSessionById(sessionId);

  if (!session) {
    return;
  }

  if (session.userId !== userId) {
    throw new AppError("You cannot revoke another user's session", 403);
  }

  await db.orm.public.Session.where({
    id: sessionId,
  }).delete();
};

// Alias
export const logout = revokeSession;

// Revoke Other Sessions

export const revokeOtherSessions = async (
  userId: string,
  currentSessionId: string,
): Promise<void> => {
  const currentSession = await getSessionById(currentSessionId);

  if (!currentSession) {
    throw new AppError("Current session not found", 404);
  }

  if (currentSession.userId !== userId) {
    throw new AppError("Invalid session", 403);
  }

  const sessions = await db.orm.public.Session.where({
    userId,
  }).all();

  const otherSessions = sessions.filter(
    (session) => session.id !== currentSessionId,
  );

  if (!otherSessions.length) {
    return;
  }

  await Promise.all(
    otherSessions.map((session) =>
      db.orm.public.Session.where({
        id: session.id,
      }).delete(),
    ),
  );
};

// Revoke All Sessions

export const revokeAllSessions = async (userId: string): Promise<void> => {
  await db.transaction(async (tx) => {
    await tx.orm.public.Session.where({
      userId,
    }).deleteAll();

    const account = await tx.orm.public.Account.where({
      userId,
      providerId: CREDENTIAL_PROVIDER,
    }).first();

    if (account) {
      await tx.orm.public.Account.where({
        id: account.id,
      }).update({
        refreshToken: null,
        refreshTokenExpiresAt: null,
      });
    }
  });
};

// Alias
export const logoutAll = revokeAllSessions;

// Auth Tokens

// Create access + refresh tokens
export const createAuthTokens = async (
  userId: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
  let user = await getFreshUserById(userId);

  user = assertValidUser(user);

  const account = await getCredentialAccount(userId);

  if (!account) {
    throw new AppError("Credential account not found", 404);
  }

  if (!account.password) {
    throw new AppError("Password authentication is not configured", 400);
  }

  const accessToken = createJWT(
    {
      sub: userId,
      role: user.role,
    },
    "accessToken",
  );

  const refreshToken = createJWT(
    {
      sub: userId,
    },
    "refreshToken",
  );

  const refreshTokenHash = hashToken(refreshToken);

  await db.orm.public.Account.where({
    id: account.id,
  }).update({
    refreshToken: refreshTokenHash,
    refreshTokenExpiresAt: getRefreshTokenExpiry(),
  });

  return {
    accessToken,
    refreshToken,
  };
};

// Fresh Access Token

// Generate a fresh access token
export const generateFreshAccessToken = async (
  refreshToken: string,
): Promise<string> => {
  if (!refreshToken?.trim()) {
    throw new AppError("Refresh token is required", 401);
  }

  let payload;

  try {
    payload = verifyToken(refreshToken, "refreshToken");
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  if (!payload || typeof payload.sub !== "string") {
    throw new AppError("Invalid refresh token", 401);
  }

  const user = await getFreshUserById(payload.sub);

  if (!user) {
    throw new AppError("User not found", 401);
  }

  if (user.banned) {
    throw new AppError("Your account has been banned", 403);
  }

  const account = await getCredentialAccount(user.id);

  if (!account?.refreshToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (account.refreshTokenExpiresAt) {
    const expiresAt = toDate(account.refreshTokenExpiresAt);

    if (isExpired(expiresAt)) {
      await db.orm.public.Account.where({
        id: account.id,
      }).update({
        refreshToken: null,
        refreshTokenExpiresAt: null,
      });

      throw new AppError("Refresh token has expired", 401);
    }
  }

  const refreshTokenHash = hashToken(refreshToken);

  if (account.refreshToken !== refreshTokenHash) {
    throw new AppError("Invalid refresh token", 401);
  }

  return createJWT(
    {
      sub: user.id,
      role: user.role,
    },
    "accessToken",
  );
};

// Verify email

export const verifyEmail = async (
  email: string,
  code: string,
): Promise<AuthUser> => {
  const normalizedEmail = normalizeEmail(email);

  const user = await getUserByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("Invalid verification request", 400);
  }

  if (user.emailVerified) {
    return user;
  }

  const verificationCode = code?.trim();

  if (!verificationCode) {
    throw new AppError("Verification code is required", 400);
  }

  await otpService.validateOtp(normalizedEmail, verificationCode);

  const updatedUser = await db.orm.public.User.where({
    id: user.id,
  }).update({
    emailVerified: true,
  });

  if (!updatedUser) {
    throw new AppError("Failed to verify email", 500);
  }

  const authUser = toAuthUser(updatedUser);

  await refreshCachedUser(authUser);

  return authUser;
};

// Resend Verification

export const resendVerification = async (
  email: string,
): Promise<boolean | null> => {
  const normalizedEmail = normalizeEmail(email);

  const user = await getUserByEmail(normalizedEmail);

  if (!user || user.emailVerified) {
    return null;
  }

  const otp = await otpService.generateOtp(normalizedEmail);

  await sendEmail({
    to: normalizedEmail,
    subject: "Verify your email",
    title: "Verify Your Email Address",
    description:
      "Thank you for joining Blood AidX. Enter the verification code below to verify your email address.",
    verificationCode: otp,
    codeLabel: "Email Verification Code",
    codeExpiresIn: "10 minutes",
    greeting: "🩸 Welcome to the Blood AidX community!",
    showSecurityNotice: false,
  });
  return true;
};

// Password Reset

// Create password reset token
export const createPasswordResetToken = async (
  email: string,
): Promise<string | null> => {
  const normalizedEmail = normalizeEmail(email);

  const user = await getUserByEmail(normalizedEmail);

  if (!user) {
    return null;
  }

  if (user.banned) {
    return null;
  }

  const token = generateToken();

  const tokenHash = hashToken(token);

  const key = getPasswordResetKey(tokenHash);

  const cacheData: PasswordResetCache = {
    userId: user.id,
    tokenHash,
  };

  await setCache(key, cacheData, PASSWORD_RESET_DURATION_SECONDS);

  return token;
};

// Reset Password

export const resetPassword = async (
  data: ResetPasswordInput,
): Promise<void> => {
  if (!data.token?.trim()) {
    throw new AppError("Reset token is required", 400);
  }

  const token = data.token.trim();

  const tokenHash = hashToken(token);

  const key = getPasswordResetKey(tokenHash);

  const resetData = await getCache<PasswordResetCache>(key);

  if (!resetData) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  if (resetData.tokenHash !== tokenHash) {
    await deleteCache(key);

    throw new AppError("Invalid reset token", 400);
  }

  const user = await getFreshUserById(resetData.userId);

  if (!user) {
    await deleteCache(key);

    throw new AppError("Invalid reset token", 400);
  }

  if (user.banned) {
    await deleteCache(key);

    throw new AppError("Your account has been banned", 403);
  }

  const account = await getCredentialAccount(user.id);

  if (!account) {
    await deleteCache(key);

    throw new AppError("Password authentication is not configured", 400);
  }

  const hashedPassword = await hashPassword(data.password);

  await db.transaction(async (tx) => {
    await tx.orm.public.Account.where({
      id: account.id,
    }).update({
      password: hashedPassword,
      refreshToken: null,
      refreshTokenExpiresAt: null,
    });

    // Resetting the password
    // invalidates every session.
    await tx.orm.public.Session.where({
      userId: user.id,
    }).deleteAll();
  });

  // Password reset tokens are single-use.
  await deleteCache(key);

  await removeCachedUser(user.id);
};

// Auth Service Type

interface AuthService {
  // User
  getUserByEmail: typeof getUserByEmail;
  getUserById: typeof getUserById;
  getFreshUserById: typeof getFreshUserById;

  // User Cache
  cacheUser: typeof cacheUser;
  getCachedUser: typeof getCachedUser;
  removeCachedUser: typeof removeCachedUser;
  refreshCachedUser: typeof refreshCachedUser;

  // Account
  getCredentialAccount: typeof getCredentialAccount;

  // Signup
  signup: typeof signup;

  // Password
  verifyAccountPassword: typeof verifyAccountPassword;
  changePassword: typeof changePassword;

  // Session
  createSession: typeof createSession;
  getSessionByToken: typeof getSessionByToken;
  getSessionById: typeof getSessionById;

  // Logout
  revokeSession: typeof revokeSession;
  logout: typeof logout;
  revokeOtherSessions: typeof revokeOtherSessions;
  revokeAllSessions: typeof revokeAllSessions;
  logoutAll: typeof logoutAll;

  // JWT
  createAuthTokens: typeof createAuthTokens;
  generateFreshAccessToken: typeof generateFreshAccessToken;

  // Email Verification
  verifyEmail: typeof verifyEmail;
  resendVerification: typeof resendVerification;

  // Password Reset
  createPasswordResetToken: typeof createPasswordResetToken;
  resetPassword: typeof resetPassword;
}

// Auth Service

export const authService: AuthService = {
  // User
  getUserByEmail,
  getUserById,
  getFreshUserById,

  // User Cache
  cacheUser,
  getCachedUser,
  removeCachedUser,
  refreshCachedUser,

  // Account
  getCredentialAccount,

  // Signup
  signup,

  // Password
  verifyAccountPassword,
  changePassword,

  // Session
  createSession,
  getSessionByToken,
  getSessionById,

  // Logout
  revokeSession,
  logout,
  revokeOtherSessions,
  revokeAllSessions,
  logoutAll,

  // JWT
  createAuthTokens,
  generateFreshAccessToken,

  // Email Verification
  verifyEmail,
  resendVerification,

  // Password Reset
  createPasswordResetToken,
  resetPassword,
};
