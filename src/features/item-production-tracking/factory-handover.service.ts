import "server-only";
import type { FactoryHandoverEventType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdminSessionUser } from "@/features/auth/admin-session.types";
import { buildAssignedJobFilter, buildProductionPlanOrderWhere } from "@/features/production-planning/production-plan-scope";

import { FACTORY_HANDOVER_TYPES, reconcileFactoryHandover, validateFactoryHandover } from "./factory-handover-balance";

function scope(session: AdminSessionUser): Prisma.ItemProductionBatchWhereInput {
  const item = buildAssignedJobFilter(session) ?? {};
  const order = buildProductionPlanOrderWhere(session);
  return { itemProductionTracking: { is: { orderItem: { is: { AND: [item, { order: { is: order } }] } } } } };
}

export async function getFactoryHandover(session: AdminSessionUser, batchId: string) {
  const batch = await prisma.itemProductionBatch.findFirst({
    where: { id: batchId, ...scope(session) },
    select: {
      id: true, code: true, status: true, supplierId: true, plannedQuantity: true,
      supplier: { select: { name: true } },
      handoverEvents: { orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true, type: true, quantity: true, reference: true, note: true, createdAt: true, createdByAdminUserId: true } },
    },
  });
  if (!batch) throw new Error("NOT_FOUND");
  return { batch, totals: reconcileFactoryHandover(batch.plannedQuantity, batch.handoverEvents) };
}

export async function recordFactoryHandover(
  session: AdminSessionUser,
  batchId: string,
  input: { type: FactoryHandoverEventType; quantity: number; reference?: string; note?: string },
) {
  if (!FACTORY_HANDOVER_TYPES.includes(input.type)) throw new Error("Loại giao nhận không hợp lệ.");
  if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) throw new Error("Số lượng phải là số nguyên dương.");
  if (input.reference && input.reference.length > 100) throw new Error("Mã chứng từ quá dài.");
  if (input.note && input.note.length > 2000) throw new Error("Ghi chú quá dài.");
  return prisma.$transaction(async tx => {
    // Serializes concurrent custody events for the same batch before checking balances.
    const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "ItemProductionBatch" WHERE "id" = ${batchId} FOR UPDATE`;
    if (locked.length === 0) throw new Error("NOT_FOUND");
    const batch = await tx.itemProductionBatch.findFirst({
      where: { id: batchId, ...scope(session) },
      select: { id: true, code: true, status: true, supplierId: true, plannedQuantity: true },
    });
    if (!batch) throw new Error("NOT_FOUND");
    if (!batch.supplierId) throw new Error("Cần phân công xưởng trước khi bàn giao.");
    if (batch.status !== "ACTIVE") throw new Error("Chỉ ghi giao nhận cho lô đang hoạt động.");
    const events = await tx.factoryHandoverEvent.findMany({ where: { batchId }, select: { type: true, quantity: true } });
    const totals = validateFactoryHandover(batch.plannedQuantity, events, input);
    const event = await tx.factoryHandoverEvent.create({
      data: {
        batchId,
        type: input.type,
        quantity: input.quantity,
        reference: input.reference?.trim() || null,
        note: input.note?.trim() || null,
        createdByAdminUserId: session.userId ?? null,
      },
    });
    return { event, totals };
  });
}
