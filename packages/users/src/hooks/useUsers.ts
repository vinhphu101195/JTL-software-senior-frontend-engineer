import { useQuery } from "@tanstack/react-query";
import { apiListUsers } from "../api/usersApi";

export const usersQueryKey = ["users"] as const;

export function useUsers() {
  return useQuery({
    queryKey: usersQueryKey,
    queryFn: apiListUsers,
  });
}
