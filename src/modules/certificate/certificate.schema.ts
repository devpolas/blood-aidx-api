import * as z from "zod";

// Certificate

export const CertificateSchema = z.object({
  id: z.uuid(),
  userMilestoneId: z.uuid(),
  certificateNo: z.string(),
  verificationCode: z.string(),
  donorName: z.string(),
  donationCount: z.number().int(),
  achievedAt: z.string(),
  issuedAt: z.string(),
  certificateUrl: z.string().nullable(),
  createdAt: z.string(),
});

export const CertificateVerificationSchema = z.object({
  valid: z.boolean(),
  certificateNumber: z.string(),
  issuedAt: z.string(),
  milestone: z.object({
    id: z.uuid(),
    name: z.string(),
    description: z.string(),
    donationCount: z.number().int(),
  }),
  recipient: z.object({
    id: z.uuid(),
    name: z.string(),
  }),
});

export type CertificateResponse = z.infer<typeof CertificateSchema>;

export type CertificateVerificationResponse = z.infer<
  typeof CertificateVerificationSchema
>;
