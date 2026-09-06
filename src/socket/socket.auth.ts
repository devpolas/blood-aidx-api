import type { ExtendedError } from "socket.io";

import { getSessionByToken } from "../modules/auth/auth.service";

import type { AppSocket } from "./socket.types";

const SESSION_COOKIE_NAME = "session_token";

const extractSessionToken = (socket: AppSocket): string | null => {
  const cookieHeader = socket.handshake.headers.cookie;

  if (typeof cookieHeader === "string") {
    const cookies = cookieHeader.split(";");

    for (const cookie of cookies) {
      const [name, ...valueParts] = cookie.trim().split("=");

      if (name === SESSION_COOKIE_NAME) {
        const value = valueParts.join("=");

        if (value) {
          return decodeURIComponent(value);
        }
      }
    }
  }

  const token = socket.handshake.auth?.token;

  if (typeof token === "string" && token.length > 0) {
    return token;
  }

  return null;
};

export const socketAuth = async (
  socket: AppSocket,
  next: (err?: ExtendedError) => void,
): Promise<void> => {
  try {
    const token = extractSessionToken(socket);

    if (!token) {
      next(new Error("Please login first"));
      return;
    }

    const auth = await getSessionByToken(token);

    if (!auth) {
      next(new Error("Invalid or expired session"));
      return;
    }

    if (auth.user.banned) {
      next(new Error("Your account has been banned"));
      return;
    }

    if (!auth.user.emailVerified) {
      next(new Error("Please verify your email first"));
      return;
    }

    socket.data.user = {
      id: auth.user.id,
      role: auth.user.role,
    };

    next();
  } catch (error) {
    console.error("Socket authentication error:", error);

    next(new Error("Authentication failed"));
  }
};
