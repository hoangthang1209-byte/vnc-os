import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { classifyDueAt, getLeadTaskAccess } from "@/features/action-center/action-center-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSessionFromCookies();
  const access = getLeadTaskAccess(session);
  if (!access.allowed) {
    return NextResponse.json({ message: access.status === 401 ? "Unauthorized" : "Forbidden" }, { status: access.status });
  }

  try {
    const now = new Date();
    // Hard cap protects Neon and the UI. hasMore indicates there are additional tasks.
    const rows = await prisma.leadTask.findMany({
      where: { completedAt: null, ...(access.ownerId ? { ownerId: access.ownerId } : {}) },
      select: {
        id: true, title: true, dueAt: true, ownerId: true,
        lead: { select: { id: true, fullName: true, companyName: true } },
      },
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      take: 101,
    });
    const tasks = rows.slice(0, 100).map((task) => ({
      id: task.id,
      title: task.title,
      dueAt: task.dueAt?.toISOString() ?? null,
      status: classifyDueAt(task.dueAt, now),
      leadId: task.lead.id,
      leadName: task.lead.companyName || task.lead.fullName,
      ownerId: task.ownerId,
    }));
    return NextResponse.json({
      source: "crm.leadTask",
      tasks,
      counts: {
        overdue: tasks.filter((task) => task.status === "overdue").length,
        today: tasks.filter((task) => task.status === "today").length,
        upcoming: tasks.filter((task) => task.status === "upcoming").length,
        unscheduled: tasks.filter((task) => task.status === "unscheduled").length,
      },
      hasMore: rows.length > 100,
      generatedAt: now.toISOString(),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[V9 Action Center] task query failed", error);
    return NextResponse.json({ message: "Không thể tải công việc CRM" }, { status: 500 });
  }
}
