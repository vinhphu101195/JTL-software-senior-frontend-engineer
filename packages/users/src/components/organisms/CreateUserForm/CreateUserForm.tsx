import { useEffect, useState, type FormEvent } from "react";
import { useSetAtom } from "jotai";
import {
  Button,
  FormField,
  Input,
  selectedUserIdAtom,
  useDebounce,
} from "@jtl/shared";
import { useCreateUser } from "../../../hooks/useCreateUser";
import { createUserSchema } from "./createUserForm.schema";
import type { User } from "../../../types";

export interface CreateUserFormProps {
  onCreated?: (user: User) => void;
}

export function CreateUserForm({ onCreated }: CreateUserFormProps) {
  const [username, setUsername] = useState("");
  const [validationError, setValidationError] = useState<string | undefined>();
  // Tracks whether validationError came from the debounced live-typing check
  // (should announce politely, without interrupting) or a submit attempt
  // (should announce immediately, via role="alert") — both paths write to
  // the same validationError state, so the priority has to be tracked
  // alongside it rather than inferred from anything else.
  const [errorPriority, setErrorPriority] = useState<"assertive" | "polite">("polite");
  const createUser = useCreateUser();
  const setSelectedUserId = useSetAtom(selectedUserIdAtom);

  const debouncedUsername = useDebounce(username, 300);
  useEffect(() => {
    if (!debouncedUsername) {
      setValidationError(undefined);
      return;
    }
    const result = createUserSchema.safeParse({ username: debouncedUsername });
    setValidationError(result.success ? undefined : result.error.issues[0]?.message);
    setErrorPriority("polite");
  }, [debouncedUsername]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createUserSchema.safeParse({ username });
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message);
      setErrorPriority("assertive");
      return;
    }
    setValidationError(undefined);
    createUser.mutate(result.data.username, {
      onSuccess: (user) => {
        setUsername("");
        setSelectedUserId(user.id);
        onCreated?.(user);
      },
    });
  }

  const errorMessage = validationError ?? (createUser.isError ? createUser.error.message : undefined);
  // A mutation failure is always a deliberate, submit-time event, regardless
  // of what errorPriority was last set to by the live-typing check.
  const displayedErrorPriority = validationError ? errorPriority : "assertive";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-sm flex-col gap-4">
      <FormField
        label="Username"
        htmlFor="username"
        error={errorMessage}
        errorPriority={displayedErrorPriority}
        hint="3-24 characters, letters/numbers/-/_ only."
      >
        <Input
          name="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="off"
          required
        />
      </FormField>
      <Button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? "Creating…" : "Create user"}
      </Button>
    </form>
  );
}
