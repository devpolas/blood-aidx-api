import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

import { comparePassword } from "../auth.utils";
import { db } from "../../../lib/db";

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      session: false,
    },
    async (email, password, done) => {
      try {
        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Identify user by email
        const user = await db.orm.public.User.where({
          email: normalizedEmail,
        }).first();

        // Don't reveal whether the email exists
        if (!user) {
          return done(null, false, {
            message: "Invalid email or password",
          });
        }

        // Check account status
        if (user.banned) {
          return done(null, false, {
            message: "Your account has been banned",
          });
        }

        // Email must be verified
        if (!user.emailVerified) {
          return done(null, false, {
            message: "Please verify your email first",
          });
        }

        // Identify credential account
        const account = await db.orm.public.Account.where({
          userId: user.id,
          providerId: "credential",
        }).first();

        // Credential account must exist
        if (!account?.password) {
          return done(null, false, {
            message: "Password authentication is not configured",
          });
        }

        // Verify password
        const passwordValid = await comparePassword(password, account.password);

        if (!passwordValid) {
          return done(null, false, {
            message: "Invalid email or password",
          });
        }

        // Authentication successful
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);
