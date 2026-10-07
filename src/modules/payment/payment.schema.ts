import * as z from "zod";

// Types

export const PaymentStatusSchema = z.enum([
  "pending",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
  "refunded",
  "partially_refunded",
]);

export const PaymentTypeSchema = z.enum(["donor_coffee"]);

export const PaymentProviderSchema = z.enum(["stripe"]);

// Create

export const CreateCoffeePaymentSchema = z
  .object({
    donorId: z.uuid(),
    amount: z
      .number()
      .positive("Payment amount must be greater than zero")
      .max(10000, "Maximum coffee amount is 10000"),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toLowerCase()),
    message: z
      .string()
      .trim()
      .max(500, "Message cannot exceed 500 characters")
      .optional(),
  })
  .strict();

// Query

export const PaymentSortBySchema = z.enum([
  "createdAt",
  "updatedAt",
  "amount",
  "paidAt",
]);

export const PaymentQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: PaymentStatusSchema.optional(),
    type: PaymentTypeSchema.optional(),
    provider: PaymentProviderSchema.optional(),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toLowerCase())
      .optional(),

    createdAtFrom: z.iso.datetime().optional(),
    createdAtTo: z.iso.datetime().optional(),
    paidAtFrom: z.iso.datetime().optional(),
    paidAtTo: z.iso.datetime().optional(),
    sortBy: PaymentSortBySchema.default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.createdAtFrom &&
      data.createdAtTo &&
      new Date(data.createdAtTo) < new Date(data.createdAtFrom)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["createdAtTo"],
        message: "createdAtTo must be greater than or equal to createdAtFrom",
      });
    }

    if (
      data.paidAtFrom &&
      data.paidAtTo &&
      new Date(data.paidAtTo) < new Date(data.paidAtFrom)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["paidAtTo"],
        message: "paidAtTo must be greater than or equal to paidAtFrom",
      });
    }
  });

// Refund

export const RefundPaymentSchema = z
  .object({
    amount: z
      .number()
      .positive("Refund amount must be greater than zero")
      .optional(),
  })
  .strict();

// Types

export type CreateCoffeePaymentInput = z.infer<
  typeof CreateCoffeePaymentSchema
>;
export type PaymentQueryInput = z.infer<typeof PaymentQuerySchema>;
export type RefundPaymentInput = z.infer<typeof RefundPaymentSchema>;
