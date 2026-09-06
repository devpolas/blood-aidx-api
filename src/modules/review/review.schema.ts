import * as z from "zod";

export const ReviewStatusSchema = z.enum([
  "pending",
  "published",
  "hidden",
  "rejected",
]);

export const CreateReviewSchema = z
  .object({
    revieweeId: z.uuid().optional(),
    organizationId: z.uuid().optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(3).max(2000),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasUser = data.revieweeId !== undefined;
    const hasOrganization = data.organizationId !== undefined;

    if (hasUser && hasOrganization) {
      ctx.addIssue({
        code: "custom",
        path: ["revieweeId"],
        message: "Review can target either a user or an organization, not both",
      });
    }

    if (!hasUser && !hasOrganization) {
      ctx.addIssue({
        code: "custom",
        path: ["revieweeId"],
        message: "Either revieweeId or organizationId is required",
      });
    }
  });

export const UpdateReviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().trim().min(3).max(2000).optional(),
  })
  .strict();

export const UpdateReviewStatusSchema = z
  .object({
    status: ReviewStatusSchema,
  })
  .strict();

export const ReviewSchema = z.object({
  id: z.uuid(),
  reviewerId: z.uuid(),
  revieweeId: z.uuid().nullable(),
  organizationId: z.uuid().nullable(),
  rating: z.number().int(),
  comment: z.string(),
  status: ReviewStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
export type UpdateReviewStatusInput = z.infer<typeof UpdateReviewStatusSchema>;
export type ReviewResponse = z.infer<typeof ReviewSchema>;
