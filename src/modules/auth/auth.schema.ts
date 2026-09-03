import * as z from "zod";

// Enums

export const UserRoleSchema = z.enum([
  "donor",
  "recipient",
  "volunteer",
  "hospital",
  "blood_bank",
  "moderator",
  "admin",
]);

export const GenderSchema = z.enum(["men", "women", "unisex"]);

// Public Signup Roles
// Admin and moderator should not be selectable during signup

export const PublicUserRoleSchema = z.enum([
  "donor",
  "recipient",
  "volunteer",
  "hospital",
  "blood_bank",
]);

// Common

export const EmailSchema = z
  .email("Invalid email address")
  .transform((value) => value.trim().toLowerCase());

export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

// Signup

export const SignUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),

  email: EmailSchema,
  password: PasswordSchema,
  gender: GenderSchema.optional(),
  role: PublicUserRoleSchema.optional().default("donor"),
});

// Signin

export const SignInSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

// Email Verification

export const VerifyEmailSchema = z.object({
  email: EmailSchema,

  code: z
    .string()
    .trim()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain only digits"),
});

// Resend Verification

export const ResendVerificationSchema = z.object({
  email: EmailSchema,
});

// Forgot Password

export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});

// Verify Password Reset OTP

export const VerifyPasswordResetSchema = z.object({
  email: EmailSchema,

  code: z
    .string()
    .trim()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain only digits"),
});

// Reset Password

export const ResetPasswordSchema = z
  .object({
    resetToken: z.string().trim().min(1, "Reset token is required"),
    password: PasswordSchema,
    confirmPassword: PasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Change Password

export const ChangePasswordSchema = z
  .object({
    currentPassword: PasswordSchema,
    newPassword: PasswordSchema,
    confirmPassword: PasswordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Session

export const SessionSchema = z.object({
  id: z.uuid(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  userId: z.uuid(),
  impersonatedBy: z.string().nullable(),
});

// Logout

export const LogoutSchema = z.object({
  sessionId: z.uuid().optional(),
});

// Logout Other Devices

export const LogoutOtherDevicesSchema = z.object({
  currentSessionId: z.uuid(),
});

// OAuth

export const OAuthProviderSchema = z.enum(["google", "github"]);

export const OAuthCallbackSchema = z.object({
  code: z.string().min(1, "OAuth code is required"),
  state: z.string().min(1, "OAuth state is required"),
});

// Auth User

export const AuthUserSchema = z.object({
  id: z.uuid(),
  name: z.string().nullable(),
  email: z.email().nullable(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: UserRoleSchema,
  gender: GenderSchema.nullable(),
  banned: z.boolean().nullable(),
});

// Auth Response

export const AuthResponseSchema = z.object({
  user: AuthUserSchema,
  session: SessionSchema.optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

// Types

export type UserRole = z.infer<typeof UserRoleSchema>;
export type Gender = z.infer<typeof GenderSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type VerifyPasswordResetInput = z.infer<
  typeof VerifyPasswordResetSchema
>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type LogoutInput = z.infer<typeof LogoutSchema>;
export type LogoutOtherDevicesInput = z.infer<typeof LogoutOtherDevicesSchema>;
export type OAuthCallbackInput = z.infer<typeof OAuthCallbackSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
