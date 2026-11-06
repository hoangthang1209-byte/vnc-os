"use client";

import Link from "next/link";
import styles from "./V9InvoicePulse.module.css";

type Invoice = { id:string; status:string; currency:string; emailDeliveryStatus:string|null; total:string };
const labels: Record<string,string> = {
  DRAFT:"Bản nháp", ISSUED:"Đã phát hành", PAID:"Đã thanh toán",
  CANCELLED:"Đã hủy", VOID:"Đã hủy", PARTIALLY_PAID:"Thanh toán một phần",
};
export default function V9InvoicePulse({invoices}:{invoices:Invoice[]}) {
  const groups = Array.from(new Set(invoices.map(x=>x.status))).map(status=>({
    status,count:invoices.filter(x=>x.status===status).length,
  }));
  const sent = invoices.filter(x=>x.emailDeliveryStatus==="DELIVERED").length;
  const failures = invoices.filter(x=>["FAILED","BOUNCED"].includes(x.emailDeliveryStatus??"")).length;
  const max = Math.max(1,...groups.map(x=>x.count));
  return <section className={styles.root} aria-label="V9 Document Operations" data-testid="v9-invoice-pulse">
    <div className={styles.banner}><div><strong>Finance & Document Operations</strong><p>Invoice Register · vòng đời chứng từ · trạng thái email</p></div>
      <Link href="/admin/settings/company">Cấu hình pháp nhân →</Link></div>
    <div className={styles.metrics}>
      {[
        ["Invoice đã tải",invoices.length,"Số bản ghi trong danh sách hiện tại"],
        ["Bản nháp",invoices.filter(x=>x.status==="DRAFT").length,"Chưa phát hành"],
        ["Email đã delivered",sent,"Nhà cung cấp báo chuyển phát"],
        ["Email lỗi / bounced",failures,"Cần kiểm tra địa chỉ nhận"],
      ].map(([title,n,note])=><div className={styles.metric} key={String(title)}><span>{title}</span><strong>{Number(n).toLocaleString("vi-VN")}</strong><small>{note}</small></div>)}
    </div>
    <div className={styles.panel}><header><strong>Trạng thái Invoice</strong><span>Đếm chứng từ, không cộng gộp USD/VND/EUR</span></header>
      <div className={styles.bars}>{groups.length?groups.map((item,i)=><div key={item.status} className={styles.row}><span>{labels[item.status]??item.status}</span><div className={styles.track}><div style={{width:`${item.count/max*100}%`,background:i%2===0?"#426b8e":"#d34a57"}}/></div><b>{item.count}</b></div>):<p className={styles.empty}>Chưa có Invoice trong danh sách.</p>}</div>
    </div>
  </section>;
}
