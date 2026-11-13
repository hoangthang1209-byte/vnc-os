"use client";

import { useState } from "react";
import Link from "next/link";
import { formatOrderDate } from "@/features/orders/order-format";
import type { ProductionDashboardResponse, ProductionPlanJobRow } from "@/features/production-planning/production-plan.types";
import styles from "./V9ProductionActionQueue.module.css";

type Mode = "mine" | "deadlines";
const riskClass: Record<string,string> = {
  red: "danger", orange: "warning", yellow: "warning", green: "normal",
};

function JobRow({job}:{job:ProductionPlanJobRow}) {
  return <li className={styles.job}>
    <div className={styles.jobTop}>
      <div className={styles.identity}>
        <Link href={`/admin/production/jobs/${encodeURIComponent(job.orderItemId)}`} className={styles.jobCode}>{job.jobCode}</Link>
        <span>{job.orderNo}</span>
      </div>
      <span className={styles.status}>{job.statusLabel}</span>
    </div>
    <strong className={styles.product}>{job.productName}</strong>
    <div className={styles.meta}>
      <span>{job.quantity.toLocaleString("vi-VN")} {job.quantityUnit}</span>
      <span>QC: {job.qcStatusLabel}</span>
      {job.ownerName && <span>{job.ownerName}</span>}
      <span className={styles[riskClass[job.riskTone]||"normal"]}>
        {job.internalDeadline ? `Hạn ${formatOrderDate(job.internalDeadline)}` : "Chưa có hạn nội bộ"}
      </span>
    </div>
    {job.risks.length > 0 && <div className={styles.risks}>{job.risks.slice(0,2).map((risk,i)=><span key={i}>{risk}</span>)}</div>}
  </li>;
}

/** Lists are scoped and capped by the Production Dashboard API. Never report these as global totals. */
export default function V9ProductionActionQueue({data}:{data:ProductionDashboardResponse}) {
  const [mode,setMode] = useState<Mode>(() => data.defaultMine ? "mine" : "deadlines");
  const jobs = mode === "mine" ? data.myJobs : data.upcomingDeadlines;
  const sorted = [...jobs].sort((a,b)=>{
    const rank = (x:ProductionPlanJobRow) => x.riskTone==="red"?0:x.riskTone==="orange"?1:x.riskTone==="yellow"?2:3;
    return rank(a)-rank(b) || (a.internalDeadline??"9999").localeCompare(b.internalDeadline??"9999");
  });
  return <section className={styles.root} aria-label="Danh sách công việc cần xử lý" data-testid="v9-production-queue">
    <header className={styles.header}>
      <div><h2>Danh sách công việc cần xử lý</h2><p>Dựa trên công việc được phân quyền; ưu tiên cảnh báo và hạn nội bộ</p></div>
      <Link href="/admin/production/plan" className={styles.openPlan}>Mở kế hoạch sản xuất</Link>
    </header>
    <div className={styles.switch} role="group" aria-label="Loại công việc">
      <button type="button" aria-pressed={mode==="mine"} className={mode==="mine"?styles.selected:""} onClick={()=>setMode("mine")}>Việc của tôi <span>{data.myJobs.length}</span></button>
      <button type="button" aria-pressed={mode==="deadlines"} className={mode==="deadlines"?styles.selected:""} onClick={()=>setMode("deadlines")}>Hạn sắp tới <span>{data.upcomingDeadlines.length}</span></button>
    </div>
    {sorted.length===0?<p className={styles.empty}>{mode==="mine"?"Không có việc được giao.":"Không có công việc có hạn sắp tới."}</p>:
      <ul className={styles.list}>{sorted.map(job=><JobRow job={job} key={job.orderItemId}/>)}</ul>}
  </section>;
}
