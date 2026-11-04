"use client";

import Link from "next/link";
import type { ProductionDashboardResponse } from "@/features/production-planning/production-plan.types";
import styles from "./V9ProductionPulse.module.css";

/** Uses only already scoped production dashboard data. Does not infer quantities from job count. */
export default function V9ProductionPulse({data}: {data:ProductionDashboardResponse}) {
  const workloadMax = Math.max(1,...data.ownerWorkload.map(item=>item.count));
  const sectionsMax = Math.max(1,...data.sections.map(item=>item.count));
  return <div className={styles.root} data-testid="v9-production-overview">
    <div className={styles.banner}><div><strong>Production Operations</strong><p>Theo dõi lệnh sản xuất, QC và hạn giao với dữ liệu phân quyền hiện tại</p></div>
      <nav aria-label="Liên kết nghiệp vụ sản xuất"><Link href="/admin/production/plan">Kế hoạch</Link><Link href="/admin/production/board">Bảng tiến độ</Link><Link href="/admin/production-suppliers">Nhà cung cấp</Link></nav>
    </div>
    <div className={styles.metrics}>
      {data.sections.slice(0,4).map(item=><Link href={item.href} className={styles.metric} key={item.key}><span>{item.label}</span><b>{item.count.toLocaleString("vi-VN")}</b><small>Nhấn để xem danh sách</small></Link>)}
    </div>
    <div className={styles.grid}>
      <section className={styles.panel}><h2>Phân bổ công việc sản xuất</h2><p className={styles.caption}>Theo các nhóm việc do Production API cung cấp</p>
        <div className={styles.bars}>{data.sections.length?data.sections.map((item,i)=><Link href={item.href} className={styles.barRow} key={item.key}><span>{item.label}</span><div className={styles.track}><div style={{width:`${item.count/sectionsMax*100}%`,background:i%2===0?"#395f85":"#d64a55"}}/></div><strong>{item.count}</strong></Link>):<p className={styles.empty}>Chưa có dữ liệu sản xuất.</p>}</div>
      </section>
      <section className={styles.panel}><h2>Tải theo người phụ trách</h2><p className={styles.caption}>Số việc được giao, không phải sản lượng sản phẩm</p>
        <div className={styles.bars}>{data.ownerWorkload.length?data.ownerWorkload.map((item,i)=><div className={styles.barRow} key={item.ownerId}><span>{item.ownerName}</span><div className={styles.track}><div style={{width:`${item.count/workloadMax*100}%`,background:i%2===0?"#558c96":"#b28d61"}}/></div><strong>{item.count}</strong></div>):<p className={styles.empty}>Chưa có công việc được phân công.</p>}</div>
      </section>
    </div>
  </div>;
}
