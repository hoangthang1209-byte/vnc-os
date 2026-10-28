import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProductionView, requireProductionUpdate } from "@/lib/admin-auth/require-production-api";
import { requireAdminPermission } from "@/lib/permissions/require-admin-permission";
import { randomUUID } from "node:crypto";

export async function GET(req: NextRequest) {
  const auth = requireProductionView(req);
  if (auth.error) return auth.error;
  const supplierId = new URL(req.url).searchParams.get("supplierId") ?? undefined;
  const items = await prisma.supplierRfq.findMany({ where: supplierId ? { supplierId } : {}, orderBy: { createdAt: "desc" }, take: 200, include: { supplier: { select: { code: true, name: true } } } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const permission = await requireAdminPermission({ platform: "manufacturing", action: "create", request: req });
  if (!permission.ok) return permission.response;
  const auth = requireProductionUpdate(req);
  if (auth.error) return auth.error;
  const b = await req.json() as Record<string, unknown>;
  const supplierId = typeof b.supplierId === "string" ? b.supplierId.trim() : "";
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const quantity = b.quantity === undefined || b.quantity === null ? null : Number(b.quantity);
  if (!supplierId || !title || (quantity !== null && (!Number.isSafeInteger(quantity) || quantity <= 0))) return NextResponse.json({ message: "Thiếu NCC, tên RFQ hoặc số lượng không hợp lệ." }, { status: 400 });
  const supplier = await prisma.productionSupplier.findUnique({ where: { id: supplierId } });
  if (!supplier) return NextResponse.json({ message: "NCC không tồn tại." }, { status: 404 });
  const row = await prisma.supplierRfq.create({ data: { id: randomUUID(), supplierId, title, quantity, productCategory: typeof b.productCategory === "string" ? b.productCategory : null, note: typeof b.note === "string" ? b.note : null } });
  return NextResponse.json(row, { status: 201 });
}
