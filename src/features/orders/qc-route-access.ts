import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { prisma } from "@/lib/prisma";
import { qcOrderScopeWhere, qcPermissionStatus } from "@/features/orders/qc-api-access";

/** Shared gate for QC evidence mutations; deny before parsing or persisting user input. */
export async function checkQcOrderAccess(
  request: NextRequest,
  orderId: string,
  action: "read" | "write",
): Promise<NextResponse | null> {
  const session = getAdminSessionFromRequest(request);
  const deniedStatus = qcPermissionStatus(session, action);
  if (deniedStatus) {
    return NextResponse.json(
      { message: deniedStatus === 401 ? "Unauthorized" : "Forbidden" },
      { status: deniedStatus },
    );
  }
  const order = await prisma.order.findFirst({
    where: { AND: [{ id: orderId }, qcOrderScopeWhere(session, action)] },
    select: { id: true },
  });
  if (!order) {
    return NextResponse.json(
      { message: "Không tìm thấy đơn hàng hoặc không có quyền truy cập" },
      { status: 404 },
    );
  }
  return null;
}
