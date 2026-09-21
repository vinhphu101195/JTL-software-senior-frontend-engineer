import { useEffect, useState, type FormEvent } from "react";
import {
  Button,
  FormField,
  Input,
  selectedUserIdAtom,
  useDebounce,
  useDefaultedFromAtom,
  type EntityId,
} from "@jtl/shared";
import { useCreateTodo } from "../../../hooks/useCreateTodo";
import { createTodoSchema } from "./createTodoForm.schema";

export interface CreateTodoFormProps {
  /**
   * Verifies the assignee id corresponds to a real user before creating the
   * to-do. Optional — omitting it keeps today's behavior (any non-empty
   * string is accepted). Awaited before the optimistic `mutate()` call, so
   * every submission pays this round-trip regardless of whether the id
   * turns out valid — a deliberate trade-off (see ai-journey/judgment.md):
   * "does this id exist" is an input-validation concern, checkable up
   * front, not an operation-failure concern like the network flakiness
   * `useCreateTodo`'s optimistic rollback already handles, so it doesn't
   * belong in that same optimistic/rollback path.
   *
   * Injected by the composition root (apps/web) so this package never
   * imports packages/users directly.
   */
  validateAssignee?: (assigneeId: EntityId) => Promise<boolean>;
}

export function CreateTodoForm({ validateAssignee }: CreateTodoFormProps) {
  const [title, setTitle] = useState("");
  const assignee = useDefaultedFromAtom(selectedUserIdAtom);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [isValidatingAssignee, setIsValidatingAssignee] = useState(false);
  // Tracks whether fieldErrors.title came from the debounced live-typing
  // check (should announce politely, without interrupting) or a submit
  // attempt (should announce immediately, via role="alert") — both paths
  // write to the same slot, so the priority has to be tracked alongside it
  // rather than inferred from anything else. Same pattern as
  // CreateUserForm's errorPriority; no third (mutation-failure) source
  // shares this slot here, so no assertive-fallback ternary is needed —
  // createTodo.isError renders as its own separate alert below.
  const [titleErrorPriority, setTitleErrorPriority] = useState<"assertive" | "polite">("polite");
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
    setTitleErrorPriority("polite");
  }, [debouncedTitle]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      setTitleErrorPriority("assertive");
      return;
    }
    setFieldErrors({});

    if (validateAssignee) {
      setIsValidatingAssignee(true);
      const isValid = await validateAssignee(result.data.assigneeId);
      setIsValidatingAssignee(false);
      if (!isValid) {
        setFieldErrors({ assigneeId: "No user found with this ID." });
        return;
      }
    }

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
      <FormField
        label="Title"
        htmlFor="todo-title"
        error={fieldErrors.title}
        errorPriority={titleErrorPriority}
      >
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
      <Button type="submit" disabled={createTodo.isPending || isValidatingAssignee}>
        {isValidatingAssignee ? "Checking assignee…" : createTodo.isPending ? "Adding…" : "Add to-do"}
      </Button>
    </form>
  );
}
