import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { isOwnerLikeSession } from "@/features/auth/admin-permissions";
import { prisma } from "@/lib/prisma";

// Owner-only until scoped project grants and staff acceptance tests are implemented.
function requireOwner(req: NextRequest): NextResponse | null {
  const session = getAdminSessionFromRequest(req);
  if (!session.authenticated) return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
  if (!isOwnerLikeSession(session)) return NextResponse.json({ message: "Không có quyền quản lý dự án đơn hàng" }, { status: 403 });
  return null;
}

export async function GET(req: NextRequest) {
  const blocked = requireOwner(req);
  if (blocked) return blocked;
  const customerId = new URL(req.url).searchParams.get("customerId")?.trim();
  if (customerId && customerId.length > 100) return NextResponse.json({ message: "customerId không hợp lệ" }, { status: 400 });
  const projects = await prisma.orderProject.findMany({
    where: customerId ? { customerId } : {},
    include: { customer: { select: { id: true, code: true, name: true } }, batches: { select: { id: true, code: true, name: true, _count: { select: { orders: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const blocked = requireOwner(req);
  if (blocked) return blocked;
  const data: unknown = await req.json().catch(() => null);
  if (!data || typeof data !== "object" || Array.isArray(data)) return NextResponse.json({ message: "JSON không hợp lệ" }, { status: 400 });
  const row = data as Record<string, unknown>;
  const customerId = typeof row.customerId === "string" ? row.customerId.trim() : "";
  const code = typeof row.code === "string" ? row.code.trim().toUpperCase() : "";
  const name = typeof row.name === "string" ? row.name.trim() : "";
  if (!customerId || !/^[A-Z0-9_-]{2,60}$/.test(code) || !name || name.length > 200) {
    return NextResponse.json({ message: "Thiếu Customer hoặc mã/tên Project không hợp lệ" }, { status: 400 });
  }
  const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } });
  if (!customer) return NextResponse.json({ message: "Không tìm thấy khách hàng" }, { status: 404 });
  const duplicate = await prisma.orderProject.findUnique({ where: { code }, select: { id: true } });
  if (duplicate) return NextResponse.json({ message: "Mã Project đã tồn tại" }, { status: 409 });
  try {
    const project = await prisma.orderProject.create({ data: { customerId, code, name, description: typeof row.description === "string" ? row.description.trim().slice(0, 2000) : null } });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("[Order Project create]", error);
    return NextResponse.json({ message: "Không thể tạo Project; kiểm tra schema hoặc mã trùng" }, { status: 409 });
  }
}
