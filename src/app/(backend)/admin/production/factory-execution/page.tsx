import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
import { buildAssignedJobFilter, buildProductionPlanOrderWhere } from "@/features/production-planning/production-plan-scope";
import { adminPageMetadata } from "@/lib/admin/admin-metadata";
import ProductionModuleNav from "@/components/admin/operations-v9/ProductionModuleNav";

export const dynamic = "force-dynamic";
export const metadata = adminPageMetadata("Factory Execution | Production");

const fmt = (n: number) => n.toLocaleString("vi-VN");
const date = (value: Date | null) => value ? value.toLocaleDateString("vi-VN") : "Chưa lập lịch";

export default async function FactoryExecutionPage() {
  const session = await getAdminSessionFromCookies();
  if (!session || !can(session, "production.view")) {
    return <main className="p-8"><h1>Không có quyền xem điều hành xưởng</h1><Link href="/admin/dashboard">Quay lại</Link></main>;
  }
  // Scope before take: never leak another user's jobs or supplier assignments.
  const scopedOrder = buildProductionPlanOrderWhere(session);
  const scopedItem = buildAssignedJobFilter(session) ?? {};
  const batches = await prisma.itemProductionBatch.findMany({
    where: { itemProductionTracking: { is: { orderItem: { is: { AND: [scopedItem, { order: { is: scopedOrder } }] } } } } },
    select: {
      id: true, code: true, name: true, plannedQuantity: true, readyQuantity: true,
      status: true, riskStatus: true, plannedStartAt: true, plannedEndAt: true,
      supplier: { select: { name: true, code: true } },
      picEmployee: { select: { fullName: true } },
      itemProductionTracking: { select: {
        orderItemId: true,
        orderItem: { select: {
          skuSnapshot: true, productNameSnapshot: true,
          order: { select: { orderNo: true } },
        } },
      } },
      stages: { where: { isApplicable: true }, select: { status: true } },
    },
    orderBy: [{ plannedEndAt: "asc" }, { id: "asc" }],
    take: 300,
  });
  const active = batches.filter(b => b.status === "ACTIVE");
  const missingFactory = batches.filter(b => b.status !== "CANCELLED" && !b.supplier);
  const delayed = batches.filter(b => b.riskStatus === "DELAYED");
  return <div className="space-y-4">
    <ProductionModuleNav />
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operations / Production</p>
        <h1 className="text-2xl font-bold">Factory Execution</h1>
        <p className="text-sm text-slate-500">Điều hành lô sản xuất thực tế theo PO, SKU, xưởng và công đoạn.</p>
      </div>
      <Link href="/admin/production/plan" className="admin-btn admin-btn--primary">Mở kế hoạch sản xuất</Link>
    </div>
    <div className="grid gap-3 sm:grid-cols-4">
      {[
        ["Tổng số lô", String(batches.length)],
        ["Đang thực hiện", String(active.length)],
        ["Chưa phân xưởng", String(missingFactory.length)],
        ["Có nguy cơ trễ", String(delayed.length)],
      ].map(([label,value])=><div key={label} className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><strong className="text-2xl">{value}</strong></div>)}
    </div>
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-[960px] w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-600"><tr>
          {["Lô sản xuất", "PO / SKU", "Xưởng", "Phụ trách", "SL kế hoạch", "Sẵn sàng", "Lịch", "Trạng thái", "Công đoạn", "Thao tác"].map(h=><th key={h} className="border-b border-slate-200 p-3">{h}</th>)}
        </tr></thead>
        <tbody>{batches.map(b=><tr key={b.id} className="border-b border-slate-100">
          <td className="p-3 font-semibold">{b.code}<div className="font-normal text-slate-500">{b.name || ""}</div></td>
          <td className="p-3"><strong>{b.itemProductionTracking.orderItem.order.orderNo}</strong>
            <div className="text-slate-500">{b.itemProductionTracking.orderItem.skuSnapshot ?? "—"}</div></td>
          <td className="p-3">{b.supplier?.name ?? <span className="font-semibold text-amber-700">Chưa phân xưởng</span>}</td>
          <td className="p-3">{b.picEmployee?.fullName ?? "—"}</td>
          <td className="p-3 text-right tabular-nums">{fmt(b.plannedQuantity)}</td>
          <td className="p-3 text-right tabular-nums">{fmt(b.readyQuantity)}</td>
          <td className="p-3 whitespace-nowrap">{date(b.plannedStartAt)} → {date(b.plannedEndAt)}</td>
          <td className="p-3">{String(b.status)}{b.riskStatus !== "ON_TRACK" && <div className="text-amber-700">{String(b.riskStatus)}</div>}</td>
          <td className="p-3">{b.stages.filter(s=>s.status==="COMPLETED").length}/{b.stages.length}</td>
          <td className="p-3"><Link className="font-semibold text-blue-700 underline" href={`/admin/production/jobs/${encodeURIComponent(b.itemProductionTracking.orderItemId)}`}>Mở Production Job</Link></td>
        </tr>)}</tbody>
      </table>
      {batches.length===0 && <div className="p-10 text-center text-sm text-slate-500">Chưa có lô sản xuất trong phạm vi được phép xem. Vào kế hoạch sản xuất để tạo lô đầu tiên.</div>}
      {batches.length===300 && <p className="p-3 text-xs text-amber-700">Đang hiển thị 300 lô đầu tiên. Cần phân trang để xem toàn bộ dữ liệu.</p>}
    </div>
    <p className="text-xs text-slate-500">Số liệu theo lô thực tế, không suy diễn từ kế hoạch PO. Mở Production Job để cập nhật phân công, nhận hàng và tiến độ theo quyền.</p>
  </div>;
}
