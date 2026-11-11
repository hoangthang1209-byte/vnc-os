"use client";

import { useState } from "react";
import Link from "next/link";
import type { OrderListDashboardRow } from "@/features/orders/order-list-dashboard.types";
import { ORDER_STATUS_LABELS } from "@/features/orders/order-labels";
import { formatOrderDate } from "@/features/orders/order-format";
import styles from "./V9OrderOperations.module.css";

export type OrderV9View = "table" | "summary" | "kanban";
type Group = "all" | "risk" | "due" | "active";

const GROUPS: { key: Group; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "risk", label: "Có cảnh báo" },
  { key: "due", label: "Hạn giao gần / trễ" },
  { key: "active", label: "Đang thực hiện" },
];

/** Single view switch for the same server-authorized page. No duplicate KPI dashboard. */
export default function V9OrderOperations({
  rows, queryString, view, onViewChange,
}: {
  rows: OrderListDashboardRow[];
  queryString: string;
  view: OrderV9View;
  onViewChange: (value: OrderV9View) => void;
}) {
  const [group, setGroup] = useState<Group>("all");
  const filtered = rows.filter(row => {
    if (group === "risk") return row.warnings.length > 0 || row.deliveryDeadlineTone === "danger";
    if (group === "due") return row.deliveryDeadlineTone === "danger" || row.deliveryDeadlineTone === "warn";
    if (group === "active") return !["COMPLETED", "CANCELLED"].includes(row.status);
    return true;
  });
  const statuses = Array.from(new Set(filtered.map(row => row.status)));
  const href = (id: string) => `/admin/orders/${encodeURIComponent(id)}?from=list&qs=${encodeURIComponent(queryString)}`;

  return <div className={styles.root} data-testid="v9-order-operations">
    <div className={styles.viewBar}>
      <span className={styles.pageCount}>{rows.length} đơn trên trang hiện tại</span>
      <div className={styles.actions} role="group" aria-label="Chế độ xem danh sách đơn hàng">
        {([["table", "Bảng"], ["summary", "Biểu đồ"], ["kanban", "Kanban"]] as const).map(([key, label]) =>
          <button key={key} type="button" className={view === key ? styles.selected : ""}
            onClick={() => onViewChange(key)} aria-pressed={view === key}>{label}</button>)}
      </div>
    </div>
    {view !== "table" && <div className={styles.tabs} role="group" aria-label="Lọc trong trang hiện tại">
      {GROUPS.map(item => <button key={item.key} type="button" aria-pressed={group === item.key}
        className={group === item.key ? styles.tabSelected : ""} onClick={() => setGroup(item.key)}>{item.label}</button>)}
    </div>}
    {view === "summary" && <div className={styles.chart} role="list" aria-label="Cơ cấu trạng thái các đơn hiện tại">
      {statuses.length ? statuses.map((status, index) => {
        const count = filtered.filter(row => row.status === status).length;
        return <div role="listitem" key={status} className={styles.barRow}>
          <span>{ORDER_STATUS_LABELS[status] ?? status}</span>
          <div className={styles.track}><div style={{ width: `${filtered.length ? count / filtered.length * 100 : 0}%`, background: index % 2 === 0 ? "#395f85" : "#d54a56" }} /></div>
          <b>{count}</b>
        </div>;
      }) : <p className={styles.empty}>Không có đơn trong nhóm này.</p>}
    </div>}
    {view === "kanban" && <div className={styles.board}>
      {statuses.length ? statuses.map(status => <section className={styles.column} key={status}>
        <h3>{ORDER_STATUS_LABELS[status] ?? status}<span>{filtered.filter(row => row.status === status).length}</span></h3>
        {filtered.filter(row => row.status === status).map(row => <Link href={href(row.id)} key={row.id} className={styles.orderCard}>
          <strong>{row.orderNo}</strong>
          <span>{row.customerCompanyName ?? row.contactName ?? "Chưa có khách hàng"}</span>
          <small>Hạn giao: {row.deliveryExpectedAt ? formatOrderDate(row.deliveryExpectedAt) : "Chưa có"} · {row.ownerName ?? "Chưa phân công"}</small>
          {row.warnings[0] && <em>{row.warnings[0]}</em>}
        </Link>)}
      </section>) : <p className={styles.empty}>Không có đơn trong nhóm này.</p>}
    </div>}
  </div>;
}
