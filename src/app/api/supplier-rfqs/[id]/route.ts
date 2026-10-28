import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProductionUpdate } from "@/lib/admin-auth/require-production-api";
import { requireAdminPermission } from "@/lib/permissions/require-admin-permission";
type Ctx = { params: Promise<{ id: string }> };
const STATUSES = new Set(["DRAFT", "SENT", "QUOTED", "ACCEPTED", "REJECTED", "CLOSED"]);
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const permission = await requireAdminPermission({ platform: "manufacturing", action: "update", request: req });
  if (!permission.ok) return permission.response;
  const auth = requireProductionUpdate(req);
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  const b = await req.json() as Record<string, unknown>;
  if (b.status !== undefined && (typeof b.status !== "string" || !STATUSES.has(b.status))) return NextResponse.json({ message: "Trạng thái RFQ không hợp lệ." }, { status: 400 });
  const quotedPrice = b.quotedPrice === undefined ? undefined : b.quotedPrice === null ? null : Number(b.quotedPrice);
  const moq = b.moq === undefined ? undefined : b.moq === null ? null : Number(b.moq);
  const leadTimeDays = b.leadTimeDays === undefined ? undefined : b.leadTimeDays === null ? null : Number(b.leadTimeDays);
  if ((quotedPrice != null && (!Number.isFinite(quotedPrice) || quotedPrice < 0)) || (moq != null && (!Number.isSafeInteger(moq) || moq < 0)) || (leadTimeDays != null && (!Number.isSafeInteger(leadTimeDays) || leadTimeDays < 0))) return NextResponse.json({ message: "Giá, MOQ hoặc lead time không hợp lệ." }, { status: 400 });
  const exists = await prisma.supplierRfq.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ message: "Không tìm thấy RFQ." }, { status: 404 });
  const row = await prisma.supplierRfq.update({ where: { id }, data: { status: b.status as string | undefined, quotedPrice, moq, leadTimeDays, note: typeof b.note === "string" ? b.note : undefined } });
  return NextResponse.json(row);
}
