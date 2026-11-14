import type { Prisma } from "@prisma/client";
import type { AdminSessionUser } from "@/features/auth/admin-session.types";
import { can } from "@/features/auth/admin-permissions";
import { buildScopedOrderWhere } from "@/features/auth/order-scope";

/** Only the QC surface uses this transitional v1 order-scope compatibility. */
export function qcOrderScopeWhere(
  session: AdminSessionUser,
  action: "read" | "write",
): Prisma.OrderWhereInput {
  if (!session.authenticated || qcPermissionStatus(session, action)) {
    return { id: "__no_access__" };
  }
  if (session.mode === "owner") return {};

  if (session.mode === "legacy" && session.permissions.size === 0) {
    if (session.legacyEmployeeRole === "ADMIN") return {};
    if (!session.employeeId) return { id: "__no_access__" };
    if (session.legacyEmployeeRole === "SALES") {
      return { salesEmployeeId: session.employeeId };
    }
    // PRODUCTION and DELIVERY may only see orders assigned to the employee.
    return {
      OR: [
        { salesEmployeeId: session.employeeId },
        { productionOwnerId: session.employeeId },
        { deliveryOwnerId: session.employeeId },
      ],
    };
  }

  const readScope = buildScopedOrderWhere(session, "orders.view");
  if (action === "read") return readScope;
  // A QC write must satisfy both visibility and the (possibly tighter) write scope.
  return {
    AND: [
      readScope,
      buildScopedOrderWhere(session, "qc.update"),
    ],
  };
}

/** Authentication and explicit permission grant, before scoped order lookup. */
export function qcPermissionStatus(
  session: AdminSessionUser,
  action: "read" | "write",
): 401 | 403 | null {
  if (!session.authenticated) return 401;
  if (!can(session, "orders.view")) return 403;
  if (action === "write" && !can(session, "qc.update")) return 403;
  return null;
}
