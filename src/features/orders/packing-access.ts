import "server-only";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { canAccessOrderRecord } from "@/features/auth/order-scope";

export async function canAccessPackingOrder(req: NextRequest, orderId: string) {
  const session = getAdminSessionFromRequest(req);
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { salesEmployeeId: true, productionOwnerId: true, deliveryOwnerId: true },
  });
  return Boolean(order && canAccessOrderRecord(session, order, "orders.view"));
}
