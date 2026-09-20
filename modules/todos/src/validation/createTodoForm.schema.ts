import { z } from "zod";

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120, "Title must be 120 characters or fewer."),
  assigneeId: z.string().trim().min(1, "Assignee (user ID) is required."),
});

export type CreateTodoFormValues = z.infer<typeof createTodoSchema>;
