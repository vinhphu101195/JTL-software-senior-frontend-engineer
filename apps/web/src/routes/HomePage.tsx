import type { FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button, FormField, Input, useDefaultedFromAtom } from "@jtl/shared";
import { selectedUserIdAtom } from "@jtl/modules-shared";
import { UserList } from "@jtl/users";

export function HomePage() {
  const userId = useDefaultedFromAtom(selectedUserIdAtom);
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId.value.trim()) return;
    void navigate({ to: "/users/$userId", params: { userId: userId.value.trim() } });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">JTL Take-Home</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create a user, then create to-do items assigned to them from the nav above.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
        <FormField label="Look up a user by ID" htmlFor="lookup-user-id">
          <Input name="userId" value={userId.value} onChange={userId.onChange} />
        </FormField>
        <Button type="submit">View user</Button>
      </form>
      <section aria-labelledby="recent-users-heading" className="flex flex-col gap-3">
        <h2 id="recent-users-heading" className="text-lg font-semibold text-slate-900">
          Recently created users
        </h2>
        <UserList onSelectUser={(user) => void navigate({ to: "/users/$userId", params: { userId: user.id } })} />
      </section>
    </div>
  );
}
