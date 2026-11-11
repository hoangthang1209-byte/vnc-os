"use client";

import Link from "next/link";
import styles from "./V9EditorialPipeline.module.css";

type Counts = {
  totalTopics:number;approvedTopics:number;briefReadyTopics:number;
  draftingTopics:number;reviewTopics:number;publishedTopics:number;
};
export default function V9EditorialPipeline({counts}:{counts:Counts}) {
  const stages = [
    {label:"Đã duyệt",n:counts.approvedTopics,href:"/admin/content/seo-topics?view=approved"},
    {label:"Brief sẵn sàng",n:counts.briefReadyTopics,href:"/admin/content/seo-topics?view=brief"},
    {label:"Đang viết",n:counts.draftingTopics,href:"/admin/content/seo-topics?view=drafting"},
    {label:"Chờ review",n:counts.reviewTopics,href:"/admin/content/reviews"},
    {label:"Đã xuất bản",n:counts.publishedTopics,href:"/admin/content/publishing"},
  ];
  const max=Math.max(1,...stages.map(s=>s.n));
  return <section className={styles.root} aria-label="V9 editorial pipeline" data-testid="v9-editorial-pipeline">
    <div className={styles.banner}><div><strong>Content & Marketing Operations</strong><p>Editorial Pipeline · SEO · Publishing</p></div><Link href="/admin/content/calendar">Lịch nội dung →</Link></div>
    <div className={styles.metrics}><div className={styles.metric}><span>Tổng chủ đề SEO</span><strong>{counts.totalTopics.toLocaleString("vi-VN")}</strong></div><div className={styles.metric}><span>Chủ đề xuất bản</span><strong>{counts.publishedTopics.toLocaleString("vi-VN")}</strong></div><div className={styles.metric}><span>Đang review</span><strong>{counts.reviewTopics.toLocaleString("vi-VN")}</strong></div></div>
    <div className={styles.panel}><h2>Tiến độ biên tập</h2><p>Phân bổ theo trạng thái SEO hiện tại; các bước không được hiểu là cohort funnel.</p>
      {stages.map((stage,index)=><Link href={stage.href} key={stage.label} className={styles.row}><span>{stage.label}</span><div className={styles.track}><div style={{width:`${stage.n/max*100}%`,background:index===4?"#31856d":"#557b9e"}}/></div><b>{stage.n}</b></Link>)}
    </div>
  </section>;
}
