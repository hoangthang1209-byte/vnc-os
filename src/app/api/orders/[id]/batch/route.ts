import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { isOwnerLikeSession } from "@/features/auth/admin-permissions";

type Context = { params: Promise<{ id: string }> };

// Restrict hierarchy changes to the owner until scoped RBAC is implemented.
export async function GET(req: NextRequest, context: Context) {
  const session = getAdminSessionFromRequest(req);
  if (!session.authenticated) return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
  if (!isOwnerLikeSession(session)) return NextResponse.json({ message: "Không có quyền xem Batch" }, { status: 403 });
  const { id } = await context.params;
  const order = await prisma.order.findUnique({ where: { id }, select: { id: true, batchId: true, customerPoNo: true } });
  if (!order) return NextResponse.json({ message: "Không tìm thấy Order" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, context: Context) {
  const session = getAdminSessionFromRequest(req);
  if (!session.authenticated) return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
  if (!isOwnerLikeSession(session)) return NextResponse.json({ message: "Không có quyền gắn Batch" }, { status: 403 });
  const { id } = await context.params;
  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ message: "JSON không hợp lệ" }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (input.batchId !== null && (typeof input.batchId !== "string" || !input.batchId.trim())) return NextResponse.json({ message: "batchId không hợp lệ" }, { status: 400 });
  if (input.customerPoNo !== undefined && input.customerPoNo !== null && (typeof input.customerPoNo !== "string" || input.customerPoNo.length > 120)) return NextResponse.json({ message: "PO khách không hợp lệ" }, { status: 400 });
  const order = await prisma.order.findUnique({ where: { id }, select: { id: true, customerId: true } });
  if (!order) return NextResponse.json({ message: "Không tìm thấy Order" }, { status: 404 });
  const batchId = typeof input.batchId === "string" ? input.batchId.trim() : null;
  if (batchId) {
    const batch = await prisma.orderBatch.findUnique({ where: { id: batchId }, include: { project: { select: { customerId: true } } } });
    if (!batch) return NextResponse.json({ message: "Không tìm thấy Batch" }, { status: 404 });
    if (!order.customerId || batch.project.customerId !== order.customerId) return NextResponse.json({ message: "Batch không thuộc Customer của Order" }, { status: 409 });
  }
  const updated = await prisma.order.update({
    where: { id },
    data: { batchId, ...(input.customerPoNo !== undefined ? { customerPoNo: typeof input.customerPoNo === "string" ? input.customerPoNo.trim() || null : null } : {}) },
    select: { id: true, orderNo: true, batchId: true, customerPoNo: true },
  });
  return NextResponse.json({ order: updated });
}
