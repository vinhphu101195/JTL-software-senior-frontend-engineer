import { useState } from "react";
import { Button } from "@jtl/shared";
import { useUsers, type User } from "@jtl/modules-users";

export interface UserListProps {
  /**
   * Called instead of following the link's href when the username is
   * clicked, so the composition root can do a client-side navigate. The
   * href stays real (not "#") so keyboard/right-click/open-in-new-tab still
   * work even without this handler — this package has no router dependency.
   */
  onSelectUser?: (user: User) => void;
}

function shortenId(id: string) {
  return `${id.slice(0, 8)}…`;
}

export function UserList({ onSelectUser }: UserListProps) {
  const { data: users, isPending, isError, error } = useUsers();
  const [copiedId, setCopiedId] = useState<string | undefined>();

  async function handleCopy(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? undefined : current)), 2000);
    } catch {
      // Clipboard access can be denied/unavailable; nothing meaningful to
      // recover into beyond not showing a false "Copied" confirmation.
    }
  }

  if (isPending) {
    return <p className="text-sm text-slate-600">Loading users…</p>;
  }

  if (isError) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error.message}
      </p>
    );
  }

  if (users.length === 0) {
    return <p className="text-sm text-slate-500">No users yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {users.map((user) => (
        <li key={user.id} className="flex items-center justify-between gap-4 rounded-md border border-slate-200 px-3 py-2">
          <div className="flex flex-col">
            <a
              href={`/users/${user.id}`}
              onClick={(event) => {
                if (!onSelectUser) return;
                event.preventDefault();
                onSelectUser(user);
              }}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              {user.username}
            </a>
            <span className="text-xs text-slate-500">{shortenId(user.id)}</span>
          </div>
          <div className="flex items-center gap-2">
            {copiedId === user.id && (
              <span role="status" aria-live="polite" className="text-xs text-slate-500">
                Copied
              </span>
            )}
            <Button variant="secondary" type="button" onClick={() => void handleCopy(user.id)}>
              Copy ID
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
