import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiCreateUser } from "../api/usersApi";
import { userQueryKey } from "./useUser";
import type { User } from "../types";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) => apiCreateUser(username),
    onSuccess: (user: User) => {
      queryClient.setQueryData(userQueryKey(user.id), user);
    },
  });
}
