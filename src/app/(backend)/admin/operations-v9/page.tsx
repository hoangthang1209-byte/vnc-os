import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
import { adminPageMetadata } from "@/lib/admin/admin-metadata";
import IntegratedProductionWorkspace from "@/components/admin/operations-v9/IntegratedProductionWorkspace";

export const metadata = adminPageMetadata("Orders · Production · Factory V9");
export const dynamic = "force-dynamic";

export default async function OperationsV9Page() {
  const session = await getAdminSessionFromCookies();
  if (!session || !can(session, "production.view")) {
    return <main className="p-8"><h1>Không có quyền xem điều hành sản xuất</h1><Link href="/admin/dashboard">Quay lại</Link></main>;
  }
  // Read-only, bounded initial rollout. Existing order/stage identities are canonical.
  const [trackings, suppliers] = await Promise.all([
    prisma.itemProductionTracking.findMany({
      take: 300, orderBy: { updatedAt: "desc" },
      select: {
        id: true, orderItemId: true, orderedQuantity: true, plannedQuantity: true,
        readyQuantity: true, riskStatus: true, productionStatus: true,
        progressPercent: true, promisedDeliveryDate: true,
        orderItem: { select: {
          id: true, orderId: true, skuSnapshot: true, productNameSnapshot: true,
          designImageUrl: true,
          order: { select: { id: true, orderNo: true, customerCompanyName: true } },
        } },
        stages: { where: { isApplicable: true }, orderBy: { sequence: "asc" },
          select: {
            id: true, labelSnapshot: true, stageKey: true, status: true,
            sequence: true, supplierId: true, plannedStartAt: true, plannedEndAt: true,
            actualStartAt: true, actualEndAt: true, plannedQuantity: true,
            completedQuantity: true, acceptedQuantity: true,
          } },
        batches: { select: { id: true, code: true, plannedQuantity: true, supplierId: true,
          stages: { select: { id: true, labelSnapshot: true, supplierId: true,
            plannedStartAt: true, plannedEndAt: true, completedQuantity: true, acceptedQuantity: true } } } },
      },
    }),
    prisma.productionSupplier.findMany({
      where: { isActive: true }, take: 500,
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true, category: true,
        capabilities: true, factoryAddress: true, phone: true, contact: true },
    }),
  ]);
  const jobs = trackings.flatMap((t) => {
    const base = {
      trackingId: t.id, orderId: t.orderItem.order.id,
      orderNo: t.orderItem.order.orderNo,
      customer: t.orderItem.order.customerCompanyName ?? "",
      orderItemId: t.orderItemId,
      sku: t.orderItem.skuSnapshot ?? t.orderItem.productNameSnapshot ?? t.orderItemId,
      name: t.orderItem.productNameSnapshot ?? t.orderItem.skuSnapshot ?? "Sản phẩm",
      image: t.orderItem.designImageUrl ?? null,
      ordered: t.orderedQuantity, ready: t.readyQuantity,
      progress: Number(t.progressPercent), risk: String(t.riskStatus),
      promised: t.promisedDeliveryDate?.toISOString() ?? null,
    };
    const grouped = t.batches.length ? t.batches.flatMap((b) => b.stages.map((s) => ({
      id: s.id, batch: b.code, stage: s.labelSnapshot,
      factoryId: s.supplierId ?? b.supplierId,
      start: s.plannedStartAt?.toISOString() ?? null,
      end: s.plannedEndAt?.toISOString() ?? null,
      done: s.completedQuantity, accepted: s.acceptedQuantity, planned: b.plannedQuantity,
    }))) : t.stages.map((s) => ({
      id: s.id, batch: null, stage: s.labelSnapshot,
      factoryId: s.supplierId,
      start: s.plannedStartAt?.toISOString() ?? null,
      end: s.plannedEndAt?.toISOString() ?? null,
      done: s.completedQuantity, accepted: s.acceptedQuantity, planned: s.plannedQuantity,
    }));
    return grouped.map((job) => ({ ...base, ...job }));
  });
  return <IntegratedProductionWorkspace jobs={jobs} factories={suppliers.map((f) => ({
    id: f.id, code: f.code, name: f.name,
    category: String(f.category), capabilities: f.capabilities ?? "",
    address: f.factoryAddress ?? "", contact: f.contact ?? "", phone: f.phone ?? "",
  }))} />;
}
