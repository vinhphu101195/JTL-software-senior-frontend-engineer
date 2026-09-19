import type { User } from "../../../types";

export interface UserDetailCardProps {
  user: User;
}

export function UserDetailCard({ user }: UserDetailCardProps) {
  return (
    <section aria-labelledby="user-detail-heading" className="max-w-sm rounded-md border border-slate-200 p-4">
      <h2 id="user-detail-heading" className="text-lg font-semibold text-slate-900">
        {user.username}
      </h2>
      <dl className="mt-2 space-y-1 text-sm text-slate-600">
        <div className="flex gap-2">
          <dt className="font-medium">ID:</dt>
          <dd className="break-all">{user.id}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Joined:</dt>
          <dd>{new Date(user.createdAt).toLocaleString()}</dd>
        </div>
      </dl>
    </section>
  );
}
