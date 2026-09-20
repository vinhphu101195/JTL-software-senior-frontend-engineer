import { z } from "zod";

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(24, "Username must be 24 characters or fewer.")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, hyphens and underscores are allowed."),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
