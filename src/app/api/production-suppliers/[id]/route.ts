import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  getProductionSupplier,
  updateProductionSupplier,
  ProductionMasterValidationError,
} from "@/features/production-master/production-supplier.service";
import { requireProductionUpdate, requireProductionView } from "@/lib/admin-auth/require-production-api";
import { parseSupplierCategory } from "@/features/patterns/pattern-supplier-snapshots";
import { archiveOrDeleteProductionSupplier } from "@/features/production-master/production-master-archive.service";
import { requireAdminPermission } from "@/lib/permissions/require-admin-permission";

type RouteContext = { params: Promise<{ id: string }> };

const SUPPLIER_TYPES = new Set(["UNKNOWN", "DIRECT_MANUFACTURER", "TRADER", "MIXED", "SERVICE_PROVIDER"]);
const VERIFICATION_STATUSES = new Set(["UNVERIFIED", "DESK_REVIEWED", "SITE_VISITED", "APPROVED", "REJECTED"]);
function supplierType(v: unknown) { return typeof v === "string" && SUPPLIER_TYPES.has(v) ? v : "UNKNOWN"; }
function verificationStatus(v: unknown) { return typeof v === "string" && VERIFICATION_STATUSES.has(v) ? v : "UNVERIFIED"; }
function optionalText(v: unknown) { return v === null ? null : typeof v === "string" ? v.trim() : undefined; }

export async function GET(req: NextRequest, context: RouteContext) {
  const auth = requireProductionView(req);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const item = await getProductionSupplier(id);
  if (!item) return NextResponse.json({ message: "Không tìm thấy nhà cung cấp." }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const permission = await requireAdminPermission({
    platform: "manufacturing",
    action: "update",
    request: req,
  });
  if (!permission.ok) return permission.response;


  const auth = requireProductionUpdate(req);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    if (body.verificationStatus === "APPROVED") {
      const approval = await requireAdminPermission({ platform: "manufacturing", action: "admin", request: req });
      if (!approval.ok) return approval.response;
    }
    const updated = await updateProductionSupplier(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      category: body.category === undefined ? undefined : parseSupplierCategory(body.category),
      supplierType: body.supplierType === undefined ? undefined : supplierType(body.supplierType),
      verificationStatus: body.verificationStatus === undefined ? undefined : verificationStatus(body.verificationStatus),
      factoryAddress: optionalText(body.factoryAddress),
      website: optionalText(body.website),
      capabilities: optionalText(body.capabilities),
      sourceUrl: optionalText(body.sourceUrl),
      contact: body.contact === null ? null : typeof body.contact === "string" ? body.contact : undefined,
      email: body.email === null ? null : typeof body.email === "string" ? body.email : undefined,
      phone: body.phone === null ? null : typeof body.phone === "string" ? body.phone : undefined,
      address: body.address === null ? null : typeof body.address === "string" ? body.address : undefined,
      notes: body.notes === null ? null : typeof body.notes === "string" ? body.notes : undefined,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return NextResponse.json({ message: "Tên nhà cung cấp bị trùng với hồ sơ hiện có." }, { status: 409 });
    if (err instanceof ProductionMasterValidationError) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Không thể lưu nhà cung cấp." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const permission = await requireAdminPermission({
    platform: "manufacturing",
    action: "delete",
    request: req,
  });
  if (!permission.ok) return permission.response;


  const auth = requireProductionUpdate(req);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  try {
    const result = await archiveOrDeleteProductionSupplier(id);
    return NextResponse.json({
      ...result,
      message: result.action === "archived" ? "Đã lưu trữ (đang dùng trong Tech Pack)." : "Đã xóa.",
    });
  } catch (err) {
    if (err instanceof ProductionMasterValidationError) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Không thể lưu trữ nhà cung cấp." }, { status: 500 });
  }
}
