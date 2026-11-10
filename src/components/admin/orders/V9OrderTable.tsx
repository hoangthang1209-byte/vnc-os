"use client";

import Link from "next/link";
import type { OrderListDashboardRow } from "@/features/orders/order-list-dashboard.types";
import { formatOrderDate } from "@/features/orders/order-format";
import { ORDER_STATUS_LABELS } from "@/features/orders/order-labels";
import styles from "./V9OrderTable.module.css";

type Props={
  rows:OrderListDashboardRow[];
  queryString:string;
  canViewCrm:boolean;
  refreshing:boolean;
};
const href=(id:string,qs:string)=>{
  const search=new URLSearchParams({from:"list"});
  if(qs)search.set("qs",qs);
  return `/admin/orders/${encodeURIComponent(id)}?${search.toString()}`;
};

export default function V9OrderTable({rows,queryString,canViewCrm,refreshing}:Props) {
  return <section className={styles.root} aria-label="Danh sách đơn hàng V9" data-testid="v9-order-table">
    {refreshing&&<p role="status" className={styles.loading}>Đang cập nhật dữ liệu…</p>}
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead><tr>
          <th>Đơn hàng</th><th>Khách hàng</th><th>Sản phẩm / Số lượng</th><th>Hạn giao</th>
          <th>Tiến độ</th><th>Phụ trách</th><th>Giao hàng</th><th>Cảnh báo</th><th aria-label="Thao tác"/>
        </tr></thead>
        <tbody>{rows.map(row=><tr key={row.id}>
          <td><Link href={href(row.id,queryString)} className={styles.orderNo}>{row.orderNo}</Link><small>{formatOrderDate(row.createdAt)}</small><span className={styles.status}>{ORDER_STATUS_LABELS[row.status]??row.status}</span></td>
          <td>{row.customerId&&canViewCrm?<Link className={styles.customer} href={`/admin/crm/customers/${encodeURIComponent(row.customerId)}`}>{row.customerCompanyName||row.contactName||"Chưa có tên"}</Link>:<span>{row.customerCompanyName||row.contactName||"—"}</span>}</td>
          <td><strong>{row.productCount} dòng hàng</strong><small>{row.totalQuantity.toLocaleString("vi-VN")} {row.quantityUnit||"sản phẩm"}</small></td>
          <td><strong>{row.deliveryExpectedAt?formatOrderDate(row.deliveryExpectedAt):"—"}</strong><small className={row.deliveryDeadlineTone==="danger"?styles.danger:row.deliveryDeadlineTone==="warn"?styles.warning:""}>{row.deliveryDeadlineRelative}</small></td>
          <td><div className={styles.progressHeader}><strong>{row.progressLabel}</strong>{row.progressPercent!=null&&<span>{Math.round(row.progressPercent)}%</span>}</div>
            {row.progressPercent!=null&&<div className={styles.track}><div style={{width:`${Math.max(0,Math.min(100,row.progressPercent))}%`}}/></div>}</td>
          <td><strong>{row.ownerName||"Chưa phân công"}</strong>{row.ownerRole&&<small>{row.ownerRole}</small>}</td>
          <td>{row.deliveryMethodLabel||"—"}<small>{row.deliveryStateLabel}</small></td>
          <td>{row.warnings.length?<div className={styles.warnings}>{row.warnings.slice(0,2).map((warning,i)=><span key={i}>{warning}</span>)}{row.warnings.length>2&&<span>+{row.warnings.length-2}</span>}</div>:<span className={styles.clear}>Không có cảnh báo</span>}</td>
          <td><Link href={href(row.id,queryString)} className={styles.open}>Mở →</Link></td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className={styles.mobileCards} aria-label="Các đơn hàng">
      {rows.map(row=><article key={row.id} className={styles.mobileCard}>
        <div className={styles.cardTitle}><Link className={styles.orderNo} href={href(row.id,queryString)}>{row.orderNo}</Link><span className={styles.status}>{ORDER_STATUS_LABELS[row.status]??row.status}</span></div>
        <strong>{row.customerCompanyName||row.contactName||"Chưa có khách hàng"}</strong>
        <p>{row.totalQuantity.toLocaleString("vi-VN")} {row.quantityUnit||"sản phẩm"} · {row.productCount} dòng hàng</p>
        <div className={styles.mobileInfo}><span>Hạn giao: {row.deliveryExpectedAt?formatOrderDate(row.deliveryExpectedAt):"—"}</span><span>{row.deliveryDeadlineRelative}</span></div>
        <div className={styles.progressHeader}><span>{row.progressLabel}</span>{row.progressPercent!=null&&<strong>{Math.round(row.progressPercent)}%</strong>}</div>
        {row.progressPercent!=null&&<div className={styles.track}><div style={{width:`${Math.max(0,Math.min(100,row.progressPercent))}%`}}/></div>}
        {row.warnings.length>0&&<div className={styles.warnings}>{row.warnings.slice(0,2).map((w,i)=><span key={i}>{w}</span>)}</div>}
        <Link href={href(row.id,queryString)} className={styles.open}>Mở chi tiết →</Link>
      </article>)}
    </div>
  </section>;
}
