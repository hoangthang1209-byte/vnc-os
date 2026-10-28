import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/permissions/require-admin-permission";
import { requireProductionView, requireProductionUpdate } from "@/lib/admin-auth/require-production-api";

type Context = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, ctx: Context) {
  const auth = requireProductionView(req);
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  const row = await prisma.materialSupplier.findUnique({
    where: { id },
    select: { id: true, supplierCode: true, name: true, productionSupplierId: true, productionSupplier: { select: { id: true, code: true, name: true } } },
  });
  return row ? NextResponse.json(row) : NextResponse.json({ message: "Không tìm thấy NCC vật tư." }, { status: 404 });
}
export async function PATCH(req: NextRequest, ctx: Context) {
  const permission = await requireAdminPermission({ platform: "manufacturing", action: "admin", request: req });
  if (!permission.ok) return permission.response;
  const auth = requireProductionUpdate(req);
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  const b = await req.json() as Record<string, unknown>;
  if (!(b.productionSupplierId === null || (typeof b.productionSupplierId === "string" && b.productionSupplierId.trim()))) {
    return NextResponse.json({ message: "Yêu cầu productionSupplierId hoặc null." }, { status: 400 });
  }
  const targetId = typeof b.productionSupplierId === "string" ? b.productionSupplierId.trim() : null;
  const [source, target] = await Promise.all([
    prisma.materialSupplier.findUnique({ where: { id } }),
    targetId ? prisma.productionSupplier.findUnique({ where: { id: targetId } }) : Promise.resolve(null),
  ]);
  if (!source || (targetId && !target)) return NextResponse.json({ message: "Không tìm thấy nhà cung cấp." }, { status: 404 });
  const linked = await prisma.materialSupplier.update({
    where: { id }, data: { productionSupplierId: targetId },
    select: { id: true, supplierCode: true, productionSupplierId: true },
  });
  return NextResponse.json(linked);
}
