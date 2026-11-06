"use client";

import Link from "next/link";
import { formatOrderDate } from "@/features/orders/order-format";
import type { OrderDetailRecord } from "@/features/orders/order.types";
import type { OrderWorkspaceTab } from "./order-workspace.types";
import styles from "./V9OrderOverview.module.css";

type Step = {label:string;date:string|null;tab:OrderWorkspaceTab;done:boolean};
export default function V9OrderOverview({order,canViewFinancials,canViewCrm,canViewProduction,onNavigateTab}:{
  order:OrderDetailRecord;canViewFinancials:boolean;canViewCrm:boolean;canViewProduction:boolean;
  onNavigateTab:(tab:OrderWorkspaceTab)=>void;
}) {
  const steps:Step[] = [
    {label:"Tạo đơn",date:order.createdAt,tab:"info",done:true},
    {label:"Xác nhận",date:order.confirmedAt,tab:"info",done:Boolean(order.confirmedAt)},
    {label:"Bắt đầu sản xuất",date:order.productionStartedAt,tab:"products",done:Boolean(order.productionStartedAt)},
    {label:"Sẵn sàng giao",date:order.readyToShipAt,tab:"delivery",done:Boolean(order.readyToShipAt)},
    {label:"Đã gửi hàng",date:order.shippedAt,tab:"delivery",done:Boolean(order.shippedAt)},
    {label:"Hoàn tất",date:order.completedAt,tab:"activity",done:Boolean(order.completedAt)},
  ];
  const quantities=order.items.reduce((sum,item)=>sum+item.quantity,0);
  const variants=order.items.reduce((sum,item)=>sum+item.variants.reduce((n,v)=>n+v.quantity,0),0);
  const productReady=order.items.length>0&&order.items.every(item=>item.variants.length>0&&item.variants.reduce((sum,v)=>sum+v.quantity,0)===item.quantity);
  return <div className={styles.root} data-testid="v9-order-detail-overview">
    <div className={styles.grid}>
      <section className={styles.card} aria-label="Hồ sơ thương mại đơn hàng">
        <h2>Order Information</h2>
        <div className={styles.summary}>
          <div><span>Khách hàng</span><strong>{order.customerCompanyName||order.customer?.name||"Chưa liên kết"}</strong></div>
          <div><span>Báo giá nguồn</span><strong>{order.quote?.quoteNo||order.sourceQuoteNo||"Đơn trực tiếp"}</strong></div>
          <div><span>Sản phẩm / dòng hàng</span><strong>{order.items.length} dòng · {quantities.toLocaleString("vi-VN")} sản phẩm</strong></div>
          <div><span>Phân size</span><strong>{variants.toLocaleString("vi-VN")} / {quantities.toLocaleString("vi-VN")} · {productReady?"Khớp":"Cần kiểm tra"}</strong></div>
          <div><span>Hạn sản xuất</span><strong>{order.productionDueDate?formatOrderDate(order.productionDueDate):"Chưa có"}</strong></div>
          <div><span>Hạn giao hàng</span><strong>{order.deliveryExpectedAt?formatOrderDate(order.deliveryExpectedAt):"Chưa có"}</strong></div>
          {canViewFinancials&&<div><span>Tổng giá trị đơn</span><strong>{order.totalAmount.toLocaleString("vi-VN")} {order.currency}</strong></div>}
        </div>
      </section>
      <section className={styles.card} aria-label="Các hồ sơ liên kết">
        <h2>Connected Records</h2>
        <p className={styles.caption}>Mở đúng hồ sơ nguồn hoặc chuyển sang tab nghiệp vụ có quyền.</p>
        <div className={styles.connections}>
          {canViewCrm&&order.customerId&&<Link href={`/admin/crm/customers/${encodeURIComponent(order.customerId)}`}><span>Khách hàng CRM</span><strong>{order.customer?.code||order.customerCode||"Xem hồ sơ"}</strong></Link>}
          {canViewFinancials&&order.quoteId&&<Link href={`/admin/quotes/${encodeURIComponent(order.quoteId)}`}><span>Báo giá</span><strong>{order.quote?.quoteNo||"Mở báo giá"}</strong></Link>}
          <button type="button" onClick={()=>onNavigateTab("info")}><span>Project / Batch</span><strong>Xem liên kết của đơn</strong></button>
          {canViewProduction&&<button type="button" onClick={()=>onNavigateTab("qc")}><span>Sản xuất & QC</span><strong>Xem từng dòng sản phẩm</strong></button>}
          <button type="button" onClick={()=>onNavigateTab("delivery")}><span>Giao hàng</span><strong>{order.deliveryTrackingCode||order.deliveryCarrierName||"Xem tình trạng giao"}</strong></button>
          <button type="button" onClick={()=>onNavigateTab("documents")}><span>Chứng từ</span><strong>Hợp đồng · Invoice · Packing</strong></button>
          <button type="button" onClick={()=>onNavigateTab("activity")}><span>Lịch sử hoạt động</span><strong>{order.activities.length} sự kiện</strong></button>
        </div>
      </section>
    </div>
    <section className={styles.timeline} aria-label="Các mốc thực hiện đơn hàng">
      <header><h2>Order Timeline</h2><p>Mốc xác nhận từ đơn hàng; chưa có ngày không được coi là hoàn tất.</p></header>
      <div className={styles.steps}>{steps.map((step,i)=><button key={step.label} type="button"
        className={step.done?styles.done:styles.waiting} onClick={()=>onNavigateTab(step.tab)}>
        <span className={styles.marker}>{step.done?"✓":i+1}</span>
        <strong>{step.label}</strong>
        <small>{step.date?formatOrderDate(step.date):"Chưa ghi nhận"}</small>
      </button>)}</div>
      {order.cancelledAt&&<p className={styles.cancelled} role="status">Đơn đã hủy ngày {formatOrderDate(order.cancelledAt)}. {order.cancelReason||""}</p>}
    </section>
  </div>;
}
