import type { EntityId } from "@jtl/shared";

export interface User {
  id: EntityId;
  username: string;
  createdAt: string;
}
