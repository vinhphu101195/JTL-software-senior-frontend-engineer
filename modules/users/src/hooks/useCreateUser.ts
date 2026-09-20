import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiCreateUser } from "../api/usersApi";
import { userQueryKey } from "./useUser";
import { usersQueryKey } from "./useUsers";
import type { User } from "../types";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) => apiCreateUser(username),
    onSuccess: (user: User) => {
      queryClient.setQueryData(userQueryKey(user.id), user);
      // Append directly to the list cache rather than invalidating — avoids
      // an extra round-trip through the fake API's delay for something we
      // already have the full data for.
      queryClient.setQueryData(usersQueryKey, (old: User[] = []) => [...old, user]);
    },
  });
}
