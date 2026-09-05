import httpStatus from "http-status";

import {
  createGoogleOAuthState,
  getGoogleAuthUrl,
  getGoogleProfile,
} from "../../config/google";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

export const googleAuthUrl = async (): Promise<string> => {
  const state = await createGoogleOAuthState();

  return getGoogleAuthUrl(state);
};

export const handleGoogleCallback = async ({
  code,
  state,
}: {
  code: string;
  state: string;
}) => {
  const googleUser = await getGoogleProfile(code, state);

  if (!googleUser.emailVerified) {
    throw new AppError("Google email is not verified.", httpStatus.BAD_REQUEST);
  }

  const user = await db.transaction(async (tx) => {
    // Find existing user

    const existingUser = await tx.orm.public.User.where({
      email: googleUser.email,
    }).first();

    // Create user if not found

    if (!existingUser) {
      const newUser = await tx.orm.public.User.create({
        name: googleUser.name ?? "Google User",
        email: googleUser.email,
        emailVerified: true,
        image: googleUser.picture,
        role: "donor",
      });

      // Use the guaranteed User returned by create()
      await tx.orm.public.Account.create({
        accountId: googleUser.id,
        providerId: "google",
        userId: newUser.id,
      });

      return newUser;
    }

    // Existing user

    const userId = existingUser.id;

    // Update email verification if necessary
    if (!existingUser.emailVerified) {
      await tx.orm.public.User.where({
        id: userId,
      }).update({
        emailVerified: true,
      });
    }

    // Find Google account

    const existingAccount = await tx.orm.public.Account.where({
      providerId: "google",
      accountId: googleUser.id,
    }).first();

    // Link Google account

    if (!existingAccount) {
      await tx.orm.public.Account.create({
        accountId: googleUser.id,
        providerId: "google",
        userId: userId,
      });
    }

    return existingUser;
  });

  return user;
};
