import { z } from "zod";

export const createCoffeePaymentSchema = z.object({
  donorId: z.uuid(),

  amount: z
    .number()
    .positive("Payment amount must be greater than zero")
    .max(10000, "Maximum coffee amount is 10000"),

  currency: z
    .string()
    .length(3)
    .default("usd")
    .transform((value) => value.toLowerCase()),

  message: z
    .string()
    .trim()
    .max(500, "Message cannot exceed 500 characters")
    .optional(),
});

export const refundPaymentSchema = z.object({
  amount: z
    .number()
    .positive("Refund amount must be greater than zero")
    .optional(),
});

export type CreateCoffeePaymentInput = z.infer<
  typeof createCoffeePaymentSchema
>;

export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
