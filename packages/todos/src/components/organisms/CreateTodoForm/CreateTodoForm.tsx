import { useState, type FormEvent } from "react";
import { useAtomValue } from "jotai";
import { Button, FormField, Input, selectedUserIdAtom } from "@jtl/shared";
import { useCreateTodo } from "../../../hooks/useCreateTodo";
import { createTodoSchema } from "./createTodoForm.schema";

export function CreateTodoForm() {
  const selectedUserId = useAtomValue(selectedUserIdAtom);
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState(selectedUserId ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const createTodo = useCreateTodo();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createTodoSchema.safeParse({ title, assigneeId });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !errors[key]) {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    createTodo.mutate(result.data, {
      onSuccess: () => setTitle(""),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-sm flex-col gap-4">
      <FormField label="Title" htmlFor="todo-title" error={fieldErrors.title}>
        <Input name="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
      </FormField>
      <FormField label="Assignee (user ID)" htmlFor="todo-assignee" error={fieldErrors.assigneeId}>
        <Input
          name="assigneeId"
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
          required
        />
      </FormField>
      {createTodo.isError && (
        <p role="alert" className="text-sm text-red-600">
          {createTodo.error.message}
        </p>
      )}
      <Button type="submit" disabled={createTodo.isPending}>
        {createTodo.isPending ? "Adding…" : "Add to-do"}
      </Button>
    </form>
  );
}
