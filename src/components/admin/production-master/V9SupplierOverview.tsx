"use client";

import Link from "next/link";
import styles from "./V9SupplierOverview.module.css";

type Supplier = { id:string; verificationStatus?:string; supplierType?:string; isActive?:boolean };
type Rfq = { id:string; status:string };
type Score = { id:string; supplier:{name:string}; weightedScore:number; period:string };
export default function V9SupplierOverview({suppliers,rfqs,scores}:{
  suppliers:Supplier[];rfqs:Rfq[];scores:Score[];
}) {
  const unverified = suppliers.filter(x=>x.verificationStatus!=="APPROVED").length;
  const factories = suppliers.filter(x=>x.supplierType==="DIRECT_MANUFACTURER").length;
  const sorted = [...scores].filter(x=>Number.isFinite(Number(x.weightedScore))).sort((a,b)=>Number(b.weightedScore)-Number(a.weightedScore)).slice(0,6);
  const max = Math.max(1,...sorted.map(x=>Number(x.weightedScore)));
  return <section className={styles.root} aria-label="V9 Supplier & Sourcing operations" data-testid="v9-supplier-overview">
    <div className={styles.banner}><div><strong>Supplier & Sourcing Operations</strong><p>Hồ sơ xưởng, RFQ, năng lực cung ứng và đánh giá chất lượng</p></div><div><Link href="/admin/production-suppliers">Danh sách NCC</Link><Link href="/admin/production">Sản xuất</Link></div></div>
    <div className={styles.metrics}>
      {[
        ["Hồ sơ nhà cung cấp",suppliers.length,"Dữ liệu đã tải từ hệ thống"],
        ["Khai báo xưởng trực tiếp",factories,"Chưa đồng nghĩa đã xác minh"],
        ["Cần xác minh",unverified,"Bao gồm chưa duyệt và không đạt"],
        ["Supplier RFQ",rfqs.length,"Trong kết quả API hiện có"],
      ].map(([label,n,note])=><div className={styles.metric} key={String(label)}><span>{label}</span><strong>{Number(n).toLocaleString("vi-VN")}</strong><small>{note}</small></div>)}
    </div>
    <div className={styles.panel}><h2>Supplier Scorecard</h2><p>Điểm đánh giá của các bản ghi đã tải. Không suy diễn thành xếp hạng toàn bộ đối tác.</p>
      {sorted.length ? <div className={styles.bars}>{sorted.map(score=><div key={score.id} className={styles.barRow}><span>{score.supplier.name}<small>{score.period}</small></span><div className={styles.track}><div style={{width:`${Math.max(0,Number(score.weightedScore)/max*100)}%`}}/></div><b>{Number(score.weightedScore).toLocaleString("vi-VN",{maximumFractionDigits:1})}</b></div>)}</div>:<p className={styles.empty}>Chưa có scorecard được ghi nhận.</p>}
    </div>
  </section>;
}
