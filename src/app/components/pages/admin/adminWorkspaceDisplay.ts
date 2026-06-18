import type { AdminUserAggregate } from "../../../api/types";
import { adminUserDisplayName } from "../../../api/mappers";

export function adminWorkspaceOwnerLabel(
  ownerId: string,
  users: AdminUserAggregate[] | null | undefined,
): { name: string; id: string } {
  const owner = users?.find((user) => user.id === ownerId);
  return {
    name: owner ? adminUserDisplayName(owner) : ownerId,
    id: ownerId,
  };
}
