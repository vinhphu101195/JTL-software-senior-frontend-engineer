import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { selectedUserIdAtom, type EntityId } from "@jtl/shared";
import { useUser, UserDetailCard } from "@jtl/users";
import { useTodosByUser, ToDoList } from "@jtl/todos";

export interface UserDetailPageProps {
  userId: EntityId;
}

/**
 * Composition root for the users <-> todos boundary: this page is allowed to
 * import both feature packages, so it resolves the assignee's display name
 * here and passes it into packages/todos as a prop, rather than either
 * feature package importing the other directly.
 */
export function UserDetailPage({ userId }: UserDetailPageProps) {
  const userQuery = useUser(userId);
  const todosQuery = useTodosByUser(userId);
  const setSelectedUserId = useSetAtom(selectedUserIdAtom);

  useEffect(() => {
    setSelectedUserId(userId);
  }, [userId, setSelectedUserId]);

  if (userQuery.isPending) {
    return <p className="text-sm text-slate-600">Loading user…</p>;
  }

  if (userQuery.isError) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {userQuery.error.message}
      </p>
    );
  }

  const user = userQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <UserDetailCard user={user} />
      <section aria-labelledby="todos-heading" className="flex flex-col gap-3">
        <h2 id="todos-heading" className="text-lg font-semibold text-slate-900">
          To-do items
        </h2>
        {todosQuery.isPending && <p className="text-sm text-slate-600">Loading to-do items…</p>}
        {todosQuery.isError && (
          <p role="alert" className="text-sm text-red-600">
            {todosQuery.error.message}
          </p>
        )}
        {todosQuery.data && (
          <ToDoList todos={todosQuery.data} resolveAssigneeName={() => user.username} />
        )}
      </section>
    </div>
  );
}
