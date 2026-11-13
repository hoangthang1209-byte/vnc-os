import type { AdminSessionUser } from "@/features/auth/admin-session.types";
import { can } from "@/features/auth/admin-permissions";

/** Access policy for QC records. Order scope is checked separately against Prisma. */
export function qcPermissionStatus(
  session: AdminSessionUser,
  action: "read" | "write",
): 401 | 403 | null {
  if (!session.authenticated) return 401;
  if (!can(session, action === "read" ? "orders.view" : "qc.update")) return 403;
  return null;
}
