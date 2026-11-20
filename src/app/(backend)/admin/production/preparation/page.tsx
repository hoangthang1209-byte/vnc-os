import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminSessionFromCookies } from "@/lib/admin-auth/get-admin-session";
import { can } from "@/features/auth/admin-permissions";
import { buildProductionPlanOrderWhere } from "@/features/production-planning/production-plan-scope";
import { adminPageMetadata } from "@/lib/admin/admin-metadata";

export const metadata = adminPageMetadata("Chuẩn bị sản xuất · BOM / Rập / Sơ đồ cắt");
export const dynamic = "force-dynamic";

const num = (n: number) => n.toLocaleString("vi-VN");
const styleNumber = (sku: string | null) => sku?.match(/^SKU-BB2-(\d{3})-(KUL|JKT|MNL|KHH)$/)?.[1] ?? "";
const marketNumber = (sku: string | null) => sku?.match(/-(KUL|JKT|MNL|KHH)$/)?.[1] ?? "";
const pill = "inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600";
const th = "whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-600";
const td = "border-b border-slate-100 px-3 py-3 text-sm text-slate-700";

export default async function ProductionPreparationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNo?: string }>;
}) {
  const query = await searchParams;
  const orderNo = typeof query.orderNo === "string" ? query.orderNo : "";
  const session = await getAdminSessionFromCookies();
  if (!session || !can(session, "production.view")) {
    return <main className="p-8"><h1>Không có quyền xem chuẩn bị sản xuất</h1><Link href="/admin/dashboard">Quay lại</Link></main>;
  }
  if (!/^ORD-\d{4}-\d{6}$/.test(orderNo)) {
    return <main className="p-8"><h1>Chuẩn bị sản xuất</h1><p>Hãy mở từ chi tiết đơn hàng để chọn đúng đơn.</p><Link href="/admin/orders">Mở Orders</Link></main>;
  }

  const order = await prisma.order.findFirst({
    where: { AND: [buildProductionPlanOrderWhere(session), { orderNo }] },
    select: {
      id: true, orderNo: true, customerId: true, customerCompanyName: true, status: true,
      items: { select: { id: true, skuSnapshot: true, productNameSnapshot: true, quantity: true } },
    },
  });
  if (!order) {
    return <main className="p-8"><h1>Không tìm thấy đơn hàng trong phạm vi truy cập</h1><Link href="/admin/orders">Mở Orders</Link></main>;
  }

  const marketItems = order.items.filter(i => ["KUL", "JKT"].includes(marketNumber(i.skuSnapshot)));
  const itemIds = marketItems.map(i => i.id);
  const patternCodes = [...new Set(marketItems.map(i => styleNumber(i.skuSnapshot)).filter(Boolean))]
    .map(code => `PAT-BB2-${code}`);
  const [patterns, materialRequirements, deliveries] = await Promise.all([
    prisma.pattern.findMany({
      where: { code: { in: patternCodes }, customerId: order.customerId },
      select: { id: true, code: true, status: true, version: true, baseSize: true,
        files: { select: { id: true, type: true } } },
    }),
    prisma.orderItemMaterialRequirement.findMany({
      where: { orderItemId: { in: itemIds } },
      select: { id: true, orderItemId: true, consumptionPerUnit: true,
        requiredQuantity: true, materialName: true, unit: true },
    }),
    prisma.orderDeliveryExecution.findMany({
      where: { orderId: order.id },
      select: { id: true, executionCode: true, status: true, expectedDeliveryAt: true,
        items: { select: { plannedQuantity: true, dispatchedQuantity: true } } },
    }),
  ]);

  const byPattern = new Map(patterns.map(p => [p.code, p]));
  const grouped = new Map<string, { name: string; kul: number; jkt: number }>();
  for (const item of marketItems) {
    const style = styleNumber(item.skuSnapshot);
    if (!style) continue;
    const row = grouped.get(style) ?? { name: item.productNameSnapshot || "Unnamed style", kul: 0, jkt: 0 };
    if (marketNumber(item.skuSnapshot) === "KUL") row.kul += item.quantity;
    else row.jkt += item.quantity;
    grouped.set(style, row);
  }
  const totalKul = [...grouped.values()].reduce((s, x) => s + x.kul, 0);
  const totalJkt = [...grouped.values()].reduce((s, x) => s + x.jkt, 0);
  const missingBom = itemIds.length - new Set(materialRequirements.map(r => r.orderItemId)).size;
  const missingPatternFiles = patternCodes.length - patterns.filter(p => p.files.length > 0).length;
  const bomCoveredItems = new Set(materialRequirements.map(r => r.orderItemId));

  return <main className="mx-auto max-w-[1500px] space-y-5 p-5 text-slate-800">
    <nav className="text-xs text-slate-500"><Link className="hover:underline" href={`/admin/orders/${order.id}`}>Đơn hàng</Link> / Chuẩn bị sản xuất</nav>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Pre-production readiness · KUL / JKT</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">BOM · Quản lý rập · Sơ đồ cắt</h1>
          <p className="mt-1 text-sm text-slate-500">{orderNo} · {order.customerCompanyName} · trạng thái đơn: {order.status}</p></div>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50" href="/admin/pattern">Thư viện rập</Link>
          <Link className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50" href="/admin/materials">Danh mục vật tư</Link>
          <Link className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700" href={`/admin/orders/${order.id}`}>Chi tiết đơn</Link>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["Malaysia · KUL", num(totalKul) + " pcs"],
          ["Indonesia · JKT", num(totalJkt) + " pcs"],
          ["Styles", String(grouped.size)],
          ["SKU thiếu BOM", String(missingBom)],
          ["Styles thiếu file rập", String(missingPatternFiles)],
        ].map(([label,value]) => <div className="rounded-lg bg-slate-50 p-3" key={label}><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-xl font-bold tabular-nums">{value}</p></div>)}
      </div>
    </section>

    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <strong>Chưa cho phép phát hành mua vật tư hoặc lệnh cắt.</strong>
      <p className="mt-1">Chưa có định mức đã duyệt, file CAD/marker hoặc xác nhận khổ vải và hiệu suất giác sơ đồ. Các mã Pattern hiện tại chỉ là hồ sơ DRAFT. Không suy diễn số mét vải từ số lượng thành phẩm.</p>
    </section>

    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3"><h2 className="font-bold">13 style — rập & định mức theo từng thị trường</h2>
        <p className="text-xs text-slate-500">Một hồ sơ rập theo style; mỗi thị trường vẫn giữ số lượng SKU độc lập.</p></div>
      <div className="overflow-x-auto"><table className="min-w-[900px] w-full border-collapse">
        <thead><tr><th className={th}>Style / Pattern</th><th className={th}>Malaysia</th><th className={th}>Indonesia</th>
          <th className={th}>Tổng</th><th className={th}>File rập</th><th className={th}>Sơ đồ cắt</th><th className={th}>BOM</th><th className={th}>Thao tác</th></tr></thead>
        <tbody>{[...grouped.entries()].sort((a,b) => a[0].localeCompare(b[0])).map(([code,v]) => {
          const pat = byPattern.get(`PAT-BB2-${code}`);
          const correspondingIds = marketItems.filter(i => styleNumber(i.skuSnapshot) === code).map(i => i.id);
          const bomCount = materialRequirements.filter(r => correspondingIds.includes(r.orderItemId)).length;
          const styleBomComplete = correspondingIds.length > 0 && correspondingIds.every(id => bomCoveredItems.has(id));
          const hasFile = Boolean(pat?.files.length);
          return <tr key={code}>
            <td className={td}><strong className="block text-slate-900">{v.name}</strong><span className="font-mono text-xs text-slate-500">PAT-BB2-{code}</span></td>
            <td className={td+" tabular-nums"}>{num(v.kul)}</td><td className={td+" tabular-nums"}>{num(v.jkt)}</td>
            <td className={td+" font-bold tabular-nums"}>{num(v.kul+v.jkt)}</td>
            <td className={td}><span className={pill}>{hasFile ? "Đã có file" : "Chưa tải lên"}</span></td>
            <td className={td}><span className={pill}>Chưa giác duyệt</span></td>
            <td className={td}><span className={pill}>{styleBomComplete ? `${bomCount} dòng định mức` : bomCount ? `Thiếu BOM ở SKU khác (${bomCount} dòng)` : "Chưa lập định mức"}</span></td>
            <td className={td}>{pat ? <Link className="font-semibold text-blue-700 hover:underline" href={`/admin/pattern/${encodeURIComponent(pat.id)}`}>Mở hồ sơ rập</Link> : "Chưa có rập"}</td>
          </tr>;
        })}</tbody>
      </table></div>
    </section>

    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-bold">Nhãn xuất hàng KUL / JKT</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {deliveries.map(d => <div className="rounded-lg border border-slate-200 p-3" key={d.id}>
          <div className="flex items-center justify-between gap-2"><strong className="font-mono text-sm">{d.executionCode}</strong><span className={pill}>{d.status}</span></div>
          <p className="mt-1 text-xs text-slate-500">Dự kiến giao: {d.expectedDeliveryAt?.toISOString().slice(0,10) || "Chưa có"}</p>
          <p className="mt-2 font-bold tabular-nums">{num(d.items.reduce((sum, i) => sum + Number(i.plannedQuantity), 0))} pcs · kế hoạch</p>
          <p className="text-xs text-slate-500">Đã xuất: {num(d.items.reduce((sum,i) => sum + Number(i.dispatchedQuantity),0))} pcs</p>
        </div>)}
      </div>
      <p className="mt-3 text-xs text-slate-500">Các nhãn này mới là allocation DRAFT, không phải vận đơn hoặc xác nhận hoàn tất đóng gói.</p>
    </section>
  </main>;
}
