import { NextRequest, NextResponse } from "next/server";
import { Prisma, PatternStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireProductionView, requireProductionUpdate } from "@/lib/admin-auth/require-production-api";
import { requireAdminPermission } from "@/lib/permissions/require-admin-permission";

type Context = { params: Promise<{ id: string }> };
type Point = { x: number; y: number };
type Line = { id: string; measurementId: string; points: Point[] };

const validPoint = (value: unknown): value is Point => {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return typeof p.x === "number" && Number.isFinite(p.x) && p.x >= 0 && p.x <= 1 &&
    typeof p.y === "number" && Number.isFinite(p.y) && p.y >= 0 && p.y <= 1;
};

export async function GET(req: NextRequest, context: Context) {
  const auth = requireProductionView(req);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const pattern = await prisma.pattern.findUnique({
    where: { id }, select: { id: true, status: true, measurementAnnotations: true },
  });
  if (!pattern) return NextResponse.json({ message: "Không tìm thấy rập." }, { status: 404 });
  return NextResponse.json({ annotations: pattern.measurementAnnotations ?? { imageFileId: null, lines: [] }, status: pattern.status });
}

export async function PUT(req: NextRequest, context: Context) {
  const permission = await requireAdminPermission({ platform: "tech-pack", action: "update", request: req });
  if (!permission.ok) return permission.response;
  const auth = requireProductionUpdate(req);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const pattern = await prisma.pattern.findUnique({
    where: { id },
    select: { status: true, measurements: { select: { id: true } }, files: { select: { id: true, type: true, mimeType: true } } },
  });
  if (!pattern) return NextResponse.json({ message: "Không tìm thấy rập." }, { status: 404 });
  if (pattern.status !== PatternStatus.DRAFT) {
    return NextResponse.json({ message: "Chỉ bản nháp mới được sửa đường đo." }, { status: 409 });
  }
  let data: unknown;
  try { data = await req.json(); } catch { return NextResponse.json({ message: "JSON không hợp lệ." }, { status: 400 }); }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ message: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  const raw = data as Record<string, unknown>;
  const imageFileId = raw.imageFileId;
  const lines = raw.lines;
  if (imageFileId !== null && (typeof imageFileId !== "string" || !pattern.files.some(
    (f) => f.id === imageFileId && (f.type === "IMAGE" || f.mimeType?.startsWith("image/"))
  ))) {
    return NextResponse.json({ message: "Ảnh phải là file hình thuộc rập này." }, { status: 400 });
  }
  if (!Array.isArray(lines) || lines.length > 100) {
    return NextResponse.json({ message: "Tối đa 100 đường đo." }, { status: 400 });
  }
  const measurementIds = new Set(pattern.measurements.map((m) => m.id));
  const seen = new Set<string>();
  for (const item of lines) {
    if (!item || typeof item !== "object") return NextResponse.json({ message: "Đường đo không hợp lệ." }, { status: 400 });
    const line = item as Partial<Line>;
    if (typeof line.id !== "string" || !/^[a-zA-Z0-9_-]{1,70}$/.test(line.id) || seen.has(line.id) ||
      typeof line.measurementId !== "string" || !measurementIds.has(line.measurementId) ||
      !Array.isArray(line.points) || line.points.length < 2 || line.points.length > 12 ||
      !line.points.every(validPoint)) {
      return NextResponse.json({ message: "Đường đo phải gắn với điểm đo hợp lệ và có 2–12 tọa độ chuẩn hóa." }, { status: 400 });
    }
    seen.add(line.id);
  }
  if (lines.length && !imageFileId) {
    return NextResponse.json({ message: "Chọn ảnh minh họa trước khi vẽ." }, { status: 400 });
  }
  const normalized = { imageFileId: imageFileId as string | null, lines: lines as Line[] };
  const updated = await prisma.pattern.update({
    where: { id }, data: { measurementAnnotations: normalized as unknown as Prisma.InputJsonValue },
    select: { measurementAnnotations: true },
  });
  return NextResponse.json({ annotations: updated.measurementAnnotations });
}
