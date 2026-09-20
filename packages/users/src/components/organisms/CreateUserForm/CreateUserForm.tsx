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
  const createUser = useCreateUser();
  const setSelectedUserId = useSetAtom(selectedUserIdAtom);

  const debouncedUsername = useDebounce(username, 300);
  useEffect(() => {
    if (!debouncedUsername) {
      setValidationError(undefined);
      return;
    }
    const result = createUserSchema.safeParse({ username: debouncedUsername });
    setValidationError(
      result.success ? undefined : result.error.issues[0]?.message,
    );
  }, [debouncedUsername]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createUserSchema.safeParse({ username });
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message);
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

  const errorMessage =
    validationError ??
    (createUser.isError ? createUser.error.message : undefined);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex max-w-sm flex-col gap-4"
    >
      <FormField
        label="Username"
        htmlFor="username"
        error={errorMessage}
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
