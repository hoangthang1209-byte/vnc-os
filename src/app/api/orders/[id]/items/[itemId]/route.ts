import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { can } from "@/features/auth/admin-permissions";
import { canAccessOrderRecord } from "@/features/auth/order-scope";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { requireAdminPermission } from "@/lib/permissions/require-admin-permission";

type Params = { params: Promise<{ id: string; itemId: string }> };
type Field = "productNameSnapshot" | "description" | "itemNote" | "designImageUrl" | "colorSnapshot";
const allowed: Field[] = ["productNameSnapshot", "description", "itemNote", "designImageUrl", "colorSnapshot"];

function validateImageUrl(value: string) {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password;
  } catch { return false; }
}

export async function PATCH(req: NextRequest, context: Params) {
  const permission = await requireAdminPermission({ platform: "commercial", action: "update", request: req });
  if (!permission.ok) return permission.response;
  const session = getAdminSessionFromRequest(req);
  if (!can(session, "orders.update")) return NextResponse.json({ message: "Không có quyền sửa SKU" }, { status: 403 });
  const { id, itemId } = await context.params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true, salesEmployeeId: true, productionOwnerId: true, deliveryOwnerId: true },
  });
  if (!order) return NextResponse.json({ message: "Không tìm thấy đơn hàng" }, { status: 404 });
  if (!canAccessOrderRecord(session, order, "orders.update"))
    return NextResponse.json({ message: "Không có quyền truy cập đơn hàng" }, { status: 403 });
  if (!["NEW", "CONFIRMED"].includes(order.status))
    return NextResponse.json({ message: "Chỉ chỉnh sửa nội dung SKU khi đơn chưa bước vào sản xuất/giao hàng" }, { status: 409 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ message: "JSON không hợp lệ" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ message: "Dữ liệu không hợp lệ" }, { status: 400 });
  const input = body as Record<string, unknown>;
  const extra = Object.keys(input).filter(k => !allowed.includes(k as Field) && k !== "applyToStyle");
  if (extra.length) return NextResponse.json({ message: `Không hỗ trợ chỉnh sửa: ${extra.join(", ")}` }, { status: 400 });
  if (input.applyToStyle !== undefined && typeof input.applyToStyle !== "boolean")
    return NextResponse.json({ message: "applyToStyle phải là boolean" }, { status: 400 });
  if (!allowed.some(key => Object.hasOwn(input,key)))
    return NextResponse.json({ message: "Chưa có dữ liệu chỉnh sửa" }, { status: 400 });

  const changes: Partial<Record<Field, string | null>> = {};
  for (const field of allowed) {
    if (!Object.hasOwn(input, field)) continue;
    if (input[field] !== null && typeof input[field] !== "string")
      return NextResponse.json({ message: `Kiểu dữ liệu không hợp lệ: ${field}` }, { status: 400 });
    const value = (input[field] as string | null)?.trim() ?? null;
    if ((value?.length ?? 0) > (field === "description" || field === "itemNote" ? 4000 : 450))
      return NextResponse.json({ message: `Trường ${field} quá dài` }, { status: 400 });
    if (field === "productNameSnapshot" && !value)
      return NextResponse.json({ message: "Tên style/SKU không được để trống" }, { status: 400 });
    if (field === "designImageUrl" && !validateImageUrl(value ?? ""))
      return NextResponse.json({ message: "Ảnh phải là HTTPS hoặc đường dẫn nội bộ hợp lệ" }, { status: 400 });
    changes[field] = value;
  }
  const source = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId: id },
    select: { id: true, orderId: true, skuSnapshot: true, productNameSnapshot: true },
  });
  if (!source) return NextResponse.json({ message: "Không tìm thấy SKU thuộc đơn hàng" }, { status: 404 });
  const applyToStyle = input.applyToStyle === true;
  if (applyToStyle && Object.keys(changes).some(field => field !== "productNameSnapshot" && field !== "designImageUrl"))
    return NextResponse.json({ message: "Chỉ cho phép sửa tên và ảnh đại diện khi áp dụng cho cả style" }, { status: 400 });
  let targetIds = [source.id];
  if (applyToStyle) {
    const match = source.skuSnapshot?.match(/^(.*)-([A-Z]{3})$/);
    if (!match) return NextResponse.json({ message: "SKU không có mã style hợp lệ để cập nhật hàng loạt" }, { status: 400 });
    const candidates = await prisma.orderItem.findMany({ where: { orderId: id, skuSnapshot: { startsWith: match[1] + "-" } }, select: { id: true, skuSnapshot: true } });
    targetIds = candidates.filter(item => item.skuSnapshot && /^([A-Z]{3})$/.test(item.skuSnapshot.slice(match[1].length+1))).map(item => item.id);
    if (!targetIds.includes(source.id)) return NextResponse.json({ message: "Không tìm thấy nhóm style" }, { status: 409 });
  }
  // Does not touch quantity, size variants, SKU identity, costing, pricing, or actual production.
  await prisma.orderItem.updateMany({ where: { orderId: id, id: { in: targetIds } }, data: { ...changes, updatedAt: new Date() } });
  return NextResponse.json({ ok: true, changedItemIds: targetIds, changedFields: Object.keys(changes) });
}
