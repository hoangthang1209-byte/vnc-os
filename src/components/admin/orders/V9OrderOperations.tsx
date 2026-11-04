"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { OrderListDashboardRow } from "@/features/orders/order-list-dashboard.types";
import { ORDER_STATUS_LABELS } from "@/features/orders/order-labels";
import { formatOrderDate } from "@/features/orders/order-format";
import styles from "./V9OrderOperations.module.css";

type Group = "all" | "risk" | "due" | "active";
const GROUPS: {key:Group;label:string}[] = [
  {key:"all",label:"Tất cả"},{key:"risk",label:"Có cảnh báo"},{key:"due",label:"Hạn giao gần / trễ"},{key:"active",label:"Đang thực hiện"},
];
export function visibleOrderPulse(rows: OrderListDashboardRow[]) {
  return {
    risk: rows.filter(row => row.warnings.length > 0 || row.deliveryDeadlineTone === "danger").length,
    due: rows.filter(row => row.deliveryDeadlineTone === "danger" || row.deliveryDeadlineTone === "warn").length,
    active: rows.filter(row => !["COMPLETED", "CANCELLED"].includes(row.status)).length,
    ready: rows.filter(row => row.status === "READY_TO_SHIP").length,
  };
}
/** Dashboard values are intentionally scoped to the current server-authorized list page. */
export default function V9OrderOperations({rows,total,queryString}:{
  rows:OrderListDashboardRow[];total:number;queryString:string;
}) {
  const [group,setGroup] = useState<Group>("all");
  const [mode,setMode] = useState<"summary"|"kanban">("summary");
  const pulse = useMemo(()=>visibleOrderPulse(rows),[rows]);
  const filtered = rows.filter(row => {
    if(group==="risk") return row.warnings.length>0 || row.deliveryDeadlineTone==="danger";
    if(group==="due") return row.deliveryDeadlineTone==="danger" || row.deliveryDeadlineTone==="warn";
    if(group==="active") return !["COMPLETED","CANCELLED"].includes(row.status);
    return true;
  });
  const byStatus = Array.from(new Set(filtered.map(row=>row.status)));
  const href = (id:string) => `/admin/orders/${id}?from=list&qs=${encodeURIComponent(queryString)}`;
  return <div className={styles.root} data-testid="v9-order-operations">
    <div className={styles.banner}><div><strong>Order Operations</strong><p>Đơn hàng · Project / Batch · Sản xuất · QC · Giao hàng</p></div><Link href="/admin/orders/projects">Xem Project / Batch →</Link></div>
    <div className={styles.metrics} aria-label="Tổng quan vận hành của trang hiện tại">
      {[
        {label:"Đơn đang hiển thị",n:rows.length,note:`Trong tổng ${total.toLocaleString("vi-VN")} đơn theo bộ lọc`},
        {label:"Đang thực hiện",n:pulse.active,note:"Chưa hoàn thành hoặc hủy"},
        {label:"Hạn giao gần / trễ",n:pulse.due,note:"Dựa trên deadline tone"},
        {label:"Có cảnh báo",n:pulse.risk,note:"Một đơn chỉ tính một lần"},
      ].map((m)=><div className={styles.metric} key={m.label}><span>{m.label}</span><b>{m.n.toLocaleString("vi-VN")}</b><small>{m.note}</small></div>)}
    </div>
    <section className={styles.panel}>
      <header className={styles.panelhead}><div><strong>Theo dõi đơn cần xử lý</strong><small>Dùng dữ liệu đơn trên trang hiện tại, không phải tổng số toàn hệ thống</small></div>
      <div className={styles.actions}><button type="button" className={mode==="summary"?styles.selected:""} onClick={()=>setMode("summary")} aria-pressed={mode==="summary"}>Tổng quan</button><button type="button" className={mode==="kanban"?styles.selected:""} onClick={()=>setMode("kanban")} aria-pressed={mode==="kanban"}>Kanban</button></div></header>
      <div className={styles.tabs} role="group" aria-label="Lọc cảnh báo trong trang hiện tại">
        {GROUPS.map(g=><button key={g.key} type="button" className={group===g.key?styles.tabSelected:""} aria-pressed={group===g.key} onClick={()=>setGroup(g.key)}>{g.label}</button>)}
      </div>
      {mode==="summary" ? <div className={styles.chart} role="list" aria-label="Cơ cấu theo trạng thái đơn hàng">
        {byStatus.length ? byStatus.map((status,index)=>{
          const count=filtered.filter(row=>row.status===status).length;
          return <div key={status} role="listitem" className={styles.barRow}>
            <span>{ORDER_STATUS_LABELS[status]??status}</span><div className={styles.track}><div style={{width:`${filtered.length?count/filtered.length*100:0}%`,background:index%2===0?"#395f85":"#d54a56"}}/></div><b>{count}</b>
          </div>;
        }) : <p className={styles.empty}>Không có đơn trong nhóm đã chọn.</p>}
      </div> : <div className={styles.board}>
        {byStatus.length ? byStatus.map(status=><div className={styles.column} key={status}>
          <h3>{ORDER_STATUS_LABELS[status]??status} <span>{filtered.filter(row=>row.status===status).length}</span></h3>
          {filtered.filter(row=>row.status===status).map(row=><Link className={styles.orderCard} href={href(row.id)} key={row.id}>
            <strong>{row.orderNo}</strong><span>{row.customerCompanyName??row.contactName??"Chưa có khách hàng"}</span>
            <small>{row.deliveryExpectedAt?formatOrderDate(row.deliveryExpectedAt):"Chưa có hạn giao"} · {row.ownerName??"Chưa phân công"}</small>
            {row.warnings[0]&&<em>{row.warnings[0]}</em>}
          </Link>)}
        </div>) : <p className={styles.empty}>Không có đơn trong nhóm đã chọn.</p>}
      </div>}
    </section>
  </div>;
}
