"use client";

import Link from "next/link";
import type { OrderListDashboardRow } from "@/features/orders/order-list-dashboard.types";
import { formatOrderDate } from "@/features/orders/order-format";
import { ORDER_STATUS_LABELS } from "@/features/orders/order-labels";
import styles from "./V9OrderTable.module.css";

type Props = {
  rows: OrderListDashboardRow[];
  queryString: string;
  canViewCrm: boolean;
  refreshing: boolean;
};
const detailHref = (id: string, qs: string) => {
  const params = new URLSearchParams({ from: "list" });
  if (qs) params.set("qs", qs);
  return `/admin/orders/${encodeURIComponent(id)}?${params.toString()}`;
};

function amount(row: OrderListDashboardRow) {
  if (typeof row.totalAmount !== "number" || !row.currency) return null;
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(row.totalAmount)} ${row.currency}`;
}

function ItemIdentity({row}:{row:OrderListDashboardRow}) {
  return <div className={styles.itemIdentity}>
    <strong>{row.primaryProductName || "Chưa đặt tên sản phẩm"}</strong>
    <small>{row.primarySku ? `SKU: ${row.primarySku}` : "Chưa có SKU"}{row.extraProductCount > 0 ? ` · +${row.extraProductCount} dòng` : ""}</small>
    <small>{row.totalQuantity.toLocaleString("vi-VN")} {row.quantityUnit || "sản phẩm"}</small>
  </div>;
}

function ProjectIdentity({row}:{row:OrderListDashboardRow}) {
  if (!row.project || !row.batch) return <span className={styles.muted}>Đơn riêng lẻ</span>;
  return <div className={styles.project}>
    <strong>{row.project.code}</strong>
    <small>{row.batch.code}</small>
  </div>;
}

function ExecutionStatus({row}:{row:OrderListDashboardRow}) {
  return <div className={styles.execution}>
    <strong>{row.progressLabel}</strong>
    <small>Công đoạn: {row.executionStageProgress || "Chưa có"}</small>
    <small>QC: {row.executionQcStatusLabel || "Chưa ghi nhận"}</small>
    {row.progressPercent != null && <div className={styles.progressHeader}>
      <span>{Math.round(row.progressPercent)}% công đoạn</span>
      <div className={styles.track}><div style={{width:`${Math.max(0,Math.min(100,row.progressPercent))}%`}}/></div>
    </div>}
  </div>;
}

function Priority({row}:{row:OrderListDashboardRow}) {
  const overdue = row.deliveryDeadlineTone === "danger" || row.productionUrgency === "OVERDUE";
  const urgent = row.warnings.includes("Cần làm lại") || row.warnings.includes("Thiếu vật tư");
  const priority = overdue ? "Quá hạn" : urgent ? "Cần can thiệp" : row.warnings.length ? "Cần theo dõi" : "Bình thường";
  const priorityClass = overdue ? styles.danger : urgent ? styles.warning : styles.muted;
  return <div className={styles.priority}>
    <strong className={priorityClass}>{priority}</strong>
    {row.warnings.slice(0,2).map((warning,i)=><small key={i}>{warning}</small>)}
  </div>;
}

export default function V9OrderTable({rows,queryString,canViewCrm,refreshing}:Props) {
  const hasFinancials = rows.some(row=>typeof row.totalAmount==="number" && Boolean(row.currency));
  return <section className={styles.root} aria-label="Danh sách đơn hàng V9" data-testid="v9-order-table">
    {refreshing&&<p role="status" className={styles.loading}>Đang cập nhật dữ liệu…</p>}
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead><tr>
          <th>Đơn hàng / Khách hàng</th><th>Project / Batch</th><th>Sản phẩm / SKU</th>
          <th>Tiến độ / QC</th><th>Hạn giao</th>{hasFinancials&&<th>Giá trị đơn</th>}
          <th>Phụ trách</th><th>Ưu tiên</th><th aria-label="Thao tác"/>
        </tr></thead>
        <tbody>{rows.map(row=><tr key={row.id}>
          <td><Link href={detailHref(row.id,queryString)} className={styles.orderNo}>{row.orderNo}</Link>
            <small>{formatOrderDate(row.createdAt)} · {ORDER_STATUS_LABELS[row.status]??row.status}</small>
            {row.customerId&&canViewCrm?
              <Link className={styles.customer} href={`/admin/crm/customers/${encodeURIComponent(row.customerId)}`}>{row.customerCompanyName||row.contactName||"Chưa có tên"}</Link>:
              <span className={styles.customerPlain}>{row.customerCompanyName||row.contactName||"—"}</span>}
          </td>
          <td><ProjectIdentity row={row}/></td>
          <td><ItemIdentity row={row}/></td>
          <td><ExecutionStatus row={row}/></td>
          <td><strong>{row.deliveryExpectedAt?formatOrderDate(row.deliveryExpectedAt):"Chưa có"}</strong>
            <small className={row.deliveryDeadlineTone==="danger"?styles.danger:row.deliveryDeadlineTone==="warn"?styles.warning:""}>{row.deliveryDeadlineRelative}</small></td>
          {hasFinancials&&<td><strong>{amount(row)||"—"}</strong></td>}
          <td><strong>{row.ownerName||"Chưa phân công"}</strong>{row.ownerRole&&<small>{row.ownerRole}</small>}</td>
          <td><Priority row={row}/></td>
          <td><Link href={detailHref(row.id,queryString)} className={styles.open}>Mở →</Link></td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className={styles.mobileCards} aria-label="Các đơn hàng">
      {rows.map(row=><article key={row.id} className={styles.mobileCard}>
        <div className={styles.cardTitle}><Link className={styles.orderNo} href={detailHref(row.id,queryString)}>{row.orderNo}</Link>
          <span className={styles.status}>{ORDER_STATUS_LABELS[row.status]??row.status}</span></div>
        <strong>{row.customerCompanyName||row.contactName||"Chưa có khách hàng"}</strong>
        <div className={styles.mobileMeta}><ProjectIdentity row={row}/><ItemIdentity row={row}/></div>
        <ExecutionStatus row={row}/>
        <div className={styles.mobileInfo}><span>Hạn giao: {row.deliveryExpectedAt?formatOrderDate(row.deliveryExpectedAt):"—"}</span>
          <span className={row.deliveryDeadlineTone==="danger"?styles.danger:""}>{row.deliveryDeadlineRelative}</span></div>
        {amount(row)&&<p className={styles.mobileAmount}>Giá trị: {amount(row)}</p>}
        <Priority row={row}/>
        <Link href={detailHref(row.id,queryString)} className={styles.open}>Mở chi tiết →</Link>
      </article>)}
    </div>
  </section>;
}
