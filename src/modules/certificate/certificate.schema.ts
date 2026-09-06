import * as z from "zod";

// Certificate

export const CertificateSchema = z.object({
  id: z.uuid(),
  userMilestoneId: z.uuid(),
  certificateNo: z.string(),
  issuedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CertificateResponse = z.infer<typeof CertificateSchema>;
