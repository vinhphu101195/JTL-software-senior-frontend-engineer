import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button, FormField, Input } from "@jtl/shared";

export function HomePage() {
  const [userId, setUserId] = useState("");
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId.trim()) return;
    void navigate({ to: "/users/$userId", params: { userId: userId.trim() } });
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
          <Input name="userId" value={userId} onChange={(event) => setUserId(event.target.value)} />
        </FormField>
        <Button type="submit">View user</Button>
      </form>
    </div>
  );
}
