import type { EntityId } from "@jtl/shared";
import { apiGetUser } from "./api/usersApi";

/**
 * A single yes/no existence check — the minimal public surface
 * packages/todos needs to validate an assignee id without either package
 * importing the other, and without packages/todos ever seeing a full User
 * shape (it stays an opaque id either way — see the README boundary
 * decision).
 */
export async function userExists(id: EntityId): Promise<boolean> {
  try {
    await apiGetUser(id);
    return true;
  } catch {
    return false;
  }
}
