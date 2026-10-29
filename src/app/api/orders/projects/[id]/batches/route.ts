import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth/get-admin-session";
import { isOwnerLikeSession } from "@/features/auth/admin-permissions";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };
function requireOwner(req: NextRequest): NextResponse | null {
  const session = getAdminSessionFromRequest(req);
  if (!session.authenticated) return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
  if (!isOwnerLikeSession(session)) return NextResponse.json({ message: "Không có quyền quản lý Batch" }, { status: 403 });
  return null;
}

export async function GET(req: NextRequest, context: Context) {
  const blocked = requireOwner(req);
  if (blocked) return blocked;
  const { id } = await context.params;
  const project = await prisma.orderProject.findUnique({ where: { id }, select: { id: true } });
  if (!project) return NextResponse.json({ message: "Không tìm thấy Project" }, { status: 404 });
  const batches = await prisma.orderBatch.findMany({ where: { projectId: id }, include: { _count: { select: { orders: true } } }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ batches });
}

export async function POST(req: NextRequest, context: Context) {
  const blocked = requireOwner(req);
  if (blocked) return blocked;
  const { id } = await context.params;
  const data: unknown = await req.json().catch(() => null);
  if (!data || typeof data !== "object" || Array.isArray(data)) return NextResponse.json({ message: "JSON không hợp lệ" }, { status: 400 });
  const row = data as Record<string, unknown>;
  const code = typeof row.code === "string" ? row.code.trim().toUpperCase() : "";
  const name = typeof row.name === "string" ? row.name.trim() : "";
  if (!/^[A-Z0-9_-]{1,60}$/.test(code) || !name || name.length > 200) return NextResponse.json({ message: "Mã/tên Batch không hợp lệ" }, { status: 400 });
  const project = await prisma.orderProject.findUnique({ where: { id }, select: { id: true } });
  if (!project) return NextResponse.json({ message: "Không tìm thấy Project" }, { status: 404 });
  const duplicate = await prisma.orderBatch.findUnique({ where: { projectId_code: { projectId: id, code } }, select: { id: true } });
  if (duplicate) return NextResponse.json({ message: "Mã Batch đã tồn tại trong Project" }, { status: 409 });
  try {
    const batch = await prisma.orderBatch.create({ data: { projectId: id, code, name, description: typeof row.description === "string" ? row.description.trim().slice(0, 2000) : null } });
    return NextResponse.json({ batch }, { status: 201 });
  } catch (error) {
    console.error("[Order Batch create]", error);
    return NextResponse.json({ message: "Không thể tạo Batch; kiểm tra schema hoặc mã trùng" }, { status: 409 });
  }
}
