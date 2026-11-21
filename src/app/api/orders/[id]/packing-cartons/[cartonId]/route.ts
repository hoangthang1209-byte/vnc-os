import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/permissions/require-admin-permission";
import { setPackingCartonSealed } from "@/features/orders/packing-carton.service";
import { ProductionExecutionValidationError } from "@/features/orders/production-quantity";

type Ctx = { params: Promise<{ id: string; cartonId: string }> };
export async function PATCH(req: NextRequest, context: Ctx) {
  const permission = await requireAdminPermission({ platform: "commercial", action: "update", request: req });
  if (!permission.ok) return permission.response;
  const { id, cartonId } = await context.params;
  try {
    const body = await req.json() as { sealed?: unknown };
    if (typeof body.sealed !== "boolean") {
      return NextResponse.json({ message: "Trạng thái đóng carton không hợp lệ." }, { status: 400 });
    }
    const carton = await setPackingCartonSealed(id, cartonId, body.sealed);
    return NextResponse.json({ carton });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không lưu được carton.";
    return NextResponse.json({ message }, { status: error instanceof ProductionExecutionValidationError ? 400 : 500 });
  }
}
