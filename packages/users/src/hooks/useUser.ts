import { useQuery } from "@tanstack/react-query";
import type { EntityId } from "@jtl/shared";
import { apiGetUser } from "../api/usersApi";

export const userQueryKey = (id: EntityId) => ["users", "detail", id] as const;

export function useUser(id: EntityId | undefined) {
  return useQuery({
    queryKey: userQueryKey(id ?? ""),
    queryFn: () => apiGetUser(id as string),
    enabled: Boolean(id),
  });
}
