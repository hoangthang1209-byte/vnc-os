import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/permissions/require-admin-permission";
import { createPackingCarton, listPackingCartons } from "@/features/orders/packing-carton.service";
import { ProductionExecutionValidationError } from "@/features/orders/production-quantity";
import { canAccessPackingOrder } from "@/features/orders/packing-access";

type Ctx = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, context: Ctx) {
  const permission = await requireAdminPermission({ platform: "commercial", action: "view", request: req });
  if (!permission.ok) return permission.response;
  const { id } = await context.params;
  if (!(await canAccessPackingOrder(req,id))) return NextResponse.json({ message: "Không có quyền truy cập đơn" },{ status: 403 });
  return NextResponse.json({ cartons: await listPackingCartons(id) });
}
export async function POST(req: NextRequest, context: Ctx) {
  const permission = await requireAdminPermission({ platform: "commercial", action: "update", request: req });
  if (!permission.ok) return permission.response;
  const { id } = await context.params;
  if (!(await canAccessPackingOrder(req,id))) return NextResponse.json({ message: "Không có quyền truy cập đơn" },{ status: 403 });
  try {
    const body = await req.json() as Record<string, unknown>;
    const carton = await createPackingCarton(id, {
      orderItemId: typeof body.orderItemId === "string" ? body.orderItemId : "",
      orderItemVariantId: typeof body.orderItemVariantId === "string" ? body.orderItemVariantId : null,
      cartonCode: typeof body.cartonCode === "string" ? body.cartonCode : "",
      quantity: typeof body.quantity === "number" ? body.quantity : 0,
      marketCode: typeof body.marketCode === "string" ? body.marketCode : null,
      sizeSnapshot: typeof body.sizeSnapshot === "string" ? body.sizeSnapshot : null,
      note: typeof body.note === "string" ? body.note : null,
    });
    return NextResponse.json({ carton }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không tạo được carton.";
    return NextResponse.json({ message }, { status: error instanceof ProductionExecutionValidationError ? 400 : 500 });
  }
}
