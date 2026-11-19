import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { can, getPermissionScope } from "@/features/auth/admin-permissions";
import { buildProductionPlanOrderWhere, buildAssignedJobFilter } from "@/features/production-planning/production-plan-scope";
import { adminPageMetadata } from "@/lib/admin/admin-metadata";
import IntegratedProductionWorkspace from "@/components/admin/operations-v9/IntegratedProductionWorkspace";

export const metadata = adminPageMetadata("Điều hành sản xuất V9");
export const dynamic = "force-dynamic";

export default async function OperationsV9Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[]; search?: string | string[] }>;
}) {
  const query = await searchParams;
  const view = typeof query.view === "string" ? query.view : query.view?.[0];
  const initialView = view === "production" || view === "factories" ? view : "orders";
  const initialSearch = typeof query.search === "string" ? query.search : query.search?.[0] ?? "";

  const session = await getAdminSessionFromCookies();
  if (!session || !can(session, "production.view")) {
    return <main className="p-8"><h1>Không có quyền xem điều hành sản xuất</h1><Link href="/admin/dashboard">Quay lại</Link></main>;
  }
  // Server-side scoping: apply BEFORE LIMIT, never filter confidential data client-side.
  const orderWhere = buildProductionPlanOrderWhere(session);
  const assignedItemWhere = buildAssignedJobFilter(session);
  const orderItemScope = assignedItemWhere ?? {};
  const [trackings, orders] = await Promise.all([
    prisma.itemProductionTracking.findMany({
      where: { orderItem: { is: { AND: [orderItemScope, { order: { is: orderWhere } }] } } },
      take: 300, orderBy: { updatedAt: "desc" },
      select: {
        id: true, orderItemId: true, note: true, orderedQuantity: true, plannedQuantity: true,
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
    prisma.order.findMany({ where: orderWhere, take: 200, orderBy: { createdAt: "desc" },
      select: { id: true, orderNo: true, customerCompanyName: true,
        status: true, productionDueDate: true, deliveryExpectedAt: true,
        items: { where: orderItemScope, select: { id: true, skuSnapshot: true, productNameSnapshot: true,
          quantity: true, designImageUrl: true } } },
    }),
  ]);
  const factoryIds = [...new Set(trackings.flatMap(t => [
    ...t.stages.map(s => s.supplierId),
    ...t.batches.flatMap(b => [b.supplierId,...b.stages.map(s => s.supplierId)]),
  ]).filter((id): id is string => Boolean(id)))];
  // Only Owners / ALL-scoped production users may see the full factory directory.
  const fullFactoryDirectory = getPermissionScope(session, "production.view") === "ALL";
  const suppliers = await prisma.productionSupplier.findMany({
    where: { isActive: true, ...(fullFactoryDirectory ? {} :
      { id: { in: factoryIds.length ? factoryIds : ["__no_access__"] } }) },
    take: 500, orderBy: { name: "asc" },
    select: { id: true, code: true, name: true, category: true,
      capabilities: true, factoryAddress: true, phone: true, contact: true },
  });
  const itemIds = [...new Set(orders.flatMap(o=>o.items.map(i=>i.id)))];
  const [techPacks, productionFiles, qcInspections] = itemIds.length ? await Promise.all([
    prisma.techPack.findMany({ where: { orderItemId: { in: itemIds } },
      select: { id:true, orderItemId:true, code:true, title:true, version:true, status:true,
        bomNotes:true, printMethodNotes:true, embroideryNotes:true, qcNotes:true } }),
    prisma.orderProductionFile.findMany({ where: { orderItemId: { in: itemIds } },
      select: { id:true, orderItemId:true, type:true, title:true, version:true, status:true } }),
    prisma.orderQcInspection.findMany({ where: { orderItemId: { in: itemIds } },
      select: { id:true, orderItemId:true, status:true, passedQuantity:true,
        defectQuantity:true, inspectedQuantity:true } }),
  ]) : [[],[],[]];
  const documents = {
    techPacks: techPacks.map(t=>({id:t.id,itemId:t.orderItemId??"",code:t.code,
      title:t.title??t.code,version:t.version,status:String(t.status),
      bom:t.bomNotes??"",artwork:[t.printMethodNotes,t.embroideryNotes].filter(Boolean).join(" · "),
      qc:t.qcNotes??""})),
    files:productionFiles.map(t=>({id:t.id,itemId:t.orderItemId??"",type:String(t.type),
      title:t.title??String(t.type),version:t.version,status:String(t.status)})),
    qc:qcInspections.map(t=>({id:t.id,itemId:t.orderItemId??"",status:String(t.status),
      inspected:Number(t.inspectedQuantity),passed:Number(t.passedQuantity),
      defective:Number(t.defectQuantity)})),
  };
  const jobs = trackings.flatMap((t) => {
    const base = {
      trackingId: t.id, demo: Boolean(t.note?.startsWith("DEMO ONLY")), orderId: t.orderItem.order.id,
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
  return <IntegratedProductionWorkspace initialView={initialView} initialSearch={initialSearch} jobs={jobs} documents={documents} orders={orders.map(o => ({
    id:o.id, orderNo:o.orderNo, customer:o.customerCompanyName??"", status:String(o.status),
    due:(o.deliveryExpectedAt??o.productionDueDate)?.toISOString()??null,
    items:o.items.map(i=>({id:i.id,sku:i.skuSnapshot??i.productNameSnapshot??i.id,name:i.productNameSnapshot??"",quantity:i.quantity,image:i.designImageUrl??null}))
  }))} factories={suppliers.map((f) => ({
    id: f.id, code: f.code, name: f.name,
    category: String(f.category), capabilities: f.capabilities ?? "",
    address: f.factoryAddress ?? "", contact: f.contact ?? "", phone: f.phone ?? "",
  }))} />;
}
