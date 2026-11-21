import { NextRequest, NextResponse } from "next/server";
import type { FactoryHandoverEventType } from "@prisma/client";
import { can } from "@/features/auth/admin-permissions";
import { requireProductionUpdate, requireProductionView } from "@/lib/admin-auth/require-production-api";
import { getFactoryHandover, recordFactoryHandover } from "@/features/item-production-tracking/factory-handover.service";

type Ctx = { params: Promise<{ batchId: string }> };
const allowedTypes = new Set(["VNC_DISPATCH", "FACTORY_RECEIVE", "FACTORY_RETURN", "VNC_RECEIVE"]);

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = requireProductionView(req);
  if (auth.error) return auth.error;
  if (!can(auth.session, "manufacturing.production.view") && !can(auth.session, "production.view")) {
    return NextResponse.json({ message: "Không có quyền xem giao nhận" }, { status: 403 });
  }
  const { batchId } = await ctx.params;
  try {
    return NextResponse.json(await getFactoryHandover(auth.session, batchId));
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error && err.message !== "NOT_FOUND" ? err.message : "Không tìm thấy lô" }, { status: err instanceof Error && err.message === "NOT_FOUND" ? 404 : 400 });
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = requireProductionUpdate(req);
  if (auth.error) return auth.error;
  if (!can(auth.session, "manufacturing.production.update") && !can(auth.session, "production.update")) {
    return NextResponse.json({ message: "Không có quyền ghi giao nhận" }, { status: 403 });
  }
  const { batchId } = await ctx.params;
  try {
    const body = await req.json() as { type?: string; quantity?: number; reference?: string; note?: string };
    if (!body.type || !allowedTypes.has(body.type)) {
      return NextResponse.json({ message: "Loại giao nhận không hợp lệ" }, { status: 400 });
    }
    const result = await recordFactoryHandover(auth.session, batchId, {
      type: body.type as FactoryHandoverEventType,
      quantity: body.quantity ?? 0, reference: body.reference, note: body.note,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Không ghi được giao nhận";
    return NextResponse.json({ message: message === "NOT_FOUND" ? "Không tìm thấy lô" : message }, { status: message === "NOT_FOUND" ? 404 : 400 });
  }
}
