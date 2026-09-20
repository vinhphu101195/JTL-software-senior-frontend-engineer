import type { EntityId } from "@jtl/modules-shared";

export interface User {
  id: EntityId;
  username: string;
  createdAt: string;
}
