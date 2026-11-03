import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { FUNNEL_STAGES, funnelPercent, funnelWhere, getFunnelAccess, parseFunnelPeriod } from "@/features/crm/v9-lead-funnel";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  const session = await getAdminSessionFromCookies();
  const access = getFunnelAccess(session);
  if (!access.allowed) return NextResponse.json({ message: access.status === 401 ? "Unauthorized" : "Forbidden" }, { status: access.status, headers });

  const periodRaw = request.nextUrl.searchParams.get("days") ?? "30";
  const days = parseFunnelPeriod(periodRaw);
  if (!days) return NextResponse.json({ message: "days must be 7, 30 or 90" }, { status: 400, headers });

  try {
    const now = new Date();
    const counts = await Promise.all(FUNNEL_STAGES.map((stage) =>
      prisma.lead.count({ where: funnelWhere(stage.key, days, now, access) }),
    ));
    const stages = FUNNEL_STAGES.map((stage, index) => ({
      ...stage,
      count: counts[index],
      rateFromPrevious: index === 0 ? null : funnelPercent(counts[index], counts[index - 1]),
      rateFromReceived: funnelPercent(counts[index], counts[0]),
    }));
    return NextResponse.json({
      days, generatedAt: now.toISOString(), scope: access.employeeId ? "assigned" : "owner",
      stages,
      disclaimer: "Cohort theo ngày tạo Lead. Báo giá/đơn hàng chỉ tính khi có liên kết trực tiếp Lead → Quote → Order. Không tự suy diễn theo Customer.",
    }, { headers });
  } catch (error) {
    console.error("[V9 Lead Funnel] cohort query failed", error);
    return NextResponse.json({ message: "Không thể tải biểu đồ phễu Lead" }, { status: 500, headers });
  }
}
