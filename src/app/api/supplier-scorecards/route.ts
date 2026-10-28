import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProductionView, requireProductionUpdate } from "@/lib/admin-auth/require-production-api";
import { requireAdminPermission } from "@/lib/permissions/require-admin-permission";
import { randomUUID } from "node:crypto";

export async function GET(req: NextRequest) {
  const auth = requireProductionView(req);
  if (auth.error) return auth.error;
  const supplierId = new URL(req.url).searchParams.get("supplierId") ?? undefined;
  const items = await prisma.supplierScorecard.findMany({ where: supplierId ? { supplierId } : {}, take: 200, orderBy: [{ period: "desc" }, { createdAt: "desc" }], include: { supplier: { select: { code: true, name: true } } } });
  return NextResponse.json({ items: items.map(({ qualityScore, deliveryScore, priceScore, responsivenessScore, ...item }) => ({ ...item, qualityScore, deliveryScore, priceScore, responsivenessScore, weightedScore: (qualityScore * 35 + deliveryScore * 30 + priceScore * 20 + responsivenessScore * 15) / 100 })) });
}

export async function POST(req: NextRequest) {
  const permission = await requireAdminPermission({ platform: "manufacturing", action: "admin", request: req });
  if (!permission.ok) return permission.response;
  const auth = requireProductionUpdate(req);
  if (auth.error) return auth.error;
  const b = await req.json() as Record<string, unknown>;
  const supplierId = typeof b.supplierId === "string" ? b.supplierId.trim() : "";
  const period = typeof b.period === "string" ? b.period.trim() : "";
  const values = ["qualityScore", "deliveryScore", "priceScore", "responsivenessScore"] as const;
  const scores = values.map(k => Number(b[k]));
  if (!supplierId || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period) || scores.some(v => !Number.isInteger(v) || v < 0 || v > 100)) return NextResponse.json({ message: "Yêu cầu NCC, kỳ YYYY-MM và điểm nguyên 0-100." }, { status: 400 });
  const supplier = await prisma.productionSupplier.findUnique({ where: { id: supplierId }, select: { id: true } });
  if (!supplier) return NextResponse.json({ message: "NCC không tồn tại." }, { status: 404 });
  const row = await prisma.supplierScorecard.upsert({ where: { supplierId_period: { supplierId, period } }, create: { id: randomUUID(), supplierId, period, qualityScore: scores[0], deliveryScore: scores[1], priceScore: scores[2], responsivenessScore: scores[3], note: typeof b.note === "string" ? b.note : null }, update: { qualityScore: scores[0], deliveryScore: scores[1], priceScore: scores[2], responsivenessScore: scores[3], note: typeof b.note === "string" ? b.note : null } });
  return NextResponse.json(row);
}
