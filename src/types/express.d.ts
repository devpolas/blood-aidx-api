import type { AuthResponse, AuthUser } from "../modules/auth/auth.schema";

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      user?: AuthUser;

      auth?: {
        user: AuthUser;
        session: NonNullable<AuthResponse["session"]>;
      };
    }
  }
}
