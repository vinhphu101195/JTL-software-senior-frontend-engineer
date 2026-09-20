import { useEffect, useState, type FormEvent } from "react";
import {
  Button,
  FormField,
  Input,
  selectedUserIdAtom,
  useDebounce,
  useDefaultedFromAtom,
} from "@jtl/shared";
import { useCreateTodo } from "../../../hooks/useCreateTodo";
import { createTodoSchema } from "./createTodoForm.schema";

export function CreateTodoForm() {
  const [title, setTitle] = useState("");
  const assignee = useDefaultedFromAtom(selectedUserIdAtom);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string | undefined>
  >({});
  const createTodo = useCreateTodo();

  const debouncedTitle = useDebounce(title, 300);
  useEffect(() => {
    const result = debouncedTitle
      ? createTodoSchema.shape.title.safeParse(debouncedTitle)
      : undefined;
    setFieldErrors((prev) => ({
      ...prev,
      title:
        result && !result.success ? result.error.issues[0]?.message : undefined,
    }));
  }, [debouncedTitle]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createTodoSchema.safeParse({
      title,
      assigneeId: assignee.value,
    });
    if (!result.success) {
      const errors: Record<string, string | undefined> = {};
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
    // Next todo defaults back to whatever the atom currently holds, rather
    // than staying pinned to whatever assignee was just typed/submitted.
    assignee.reset();
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex max-w-sm flex-col gap-4"
    >
      <FormField label="Title" htmlFor="todo-title" error={fieldErrors.title}>
        <Input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </FormField>
      <FormField
        label="Assignee (user ID)"
        htmlFor="todo-assignee"
        error={fieldErrors.assigneeId}
      >
        <Input
          name="assigneeId"
          value={assignee.value}
          onChange={assignee.onChange}
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
