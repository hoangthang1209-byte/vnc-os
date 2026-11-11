"use client";

import { useState } from "react";
import styles from "./V9ExecutiveCharts.module.css";

type Monthly = { label: string; count: number };
type Source = { label: string; count: number };
type StatusBucket = { label: string; count: number };
export default function V9ExecutiveCharts({ months, sources, statuses }: { months: Monthly[]; sources: Source[]; statuses: StatusBucket[] }) {
  const [mode, setMode] = useState<"bar" | "line">("bar");
  const max = Math.max(1, ...months.map((item) => item.count));
  const total = sources.reduce((sum, item) => sum + item.count, 0);
  const palette = ["#d92f3a", "#356ba8", "#2e9878", "#e0aa58", "#8e9bb2", "#b57ca8"];
  const x = (index: number) => 32 + (index + 0.5) * 620 / Math.max(months.length, 1);
  const y = (value: number) => 15 + 165 * (1 - value / max);
  const points = months.map((item, i) => `${x(i)},${y(item.count)}`).join(" ");
  return <section className={styles.section} aria-label="V9 Executive Analytics">
    <div className={styles.heading}><strong>Phân tích vận hành</strong><span>Số liệu thật từ VNC OS · 6 tháng gần nhất</span></div>
    <div className={styles.grid}>
      <div className={styles.panel}>
        <header><div><strong>Đơn hàng tạo mới theo tháng</strong><small>Số lượng đơn, không cộng lẫn các đơn tiền tệ khác nhau</small></div>
          <div className={styles.switch} role="group" aria-label="Chế độ biểu đồ"><button type="button" aria-pressed={mode==="bar"} className={mode==="bar"?styles.active:""} onClick={()=>setMode("bar")}>Cột</button><button type="button" aria-pressed={mode==="line"} className={mode==="line"?styles.active:""} onClick={()=>setMode("line")}>Đường</button></div>
        </header>
        <div className={styles.chart}><svg viewBox="0 0 680 225" role="img" aria-label={months.map((m)=>`${m.label}: ${m.count} đơn`).join("; ")}>
          {[0,.25,.5,.75,1].map((n)=> <line key={n} x1="32" x2="661" y1={y(max*n)} y2={y(max*n)} stroke="#edf1f5"/>)}
          {mode==="bar" ? months.map((m,i)=><rect key={m.label} x={x(i)-23} y={y(m.count)} width="46" height={180-y(m.count)} rx="4" fill={i===months.length-1?"#d92f3a":"#a7bdd2"}><title>{m.label}: {m.count} đơn</title></rect>): <><polyline points={points} fill="none" stroke="#d92f3a" strokeWidth="3"/>{months.map((m,i)=><circle key={m.label} cx={x(i)} cy={y(m.count)} r="4.5" stroke="#d92f3a" strokeWidth="2" fill="#fff"><title>{m.label}: {m.count} đơn</title></circle>)}</>}
          {months.map((m,i)=><text key={m.label} x={x(i)} y="207" fill="#8793a2" fontSize="11" textAnchor="middle">{m.label}</text>)}
        </svg></div>
      </div>
      <div className={styles.panel}>
        <header><div><strong>Lead theo nguồn</strong><small>Cơ cấu nguồn tiếp nhận đã ghi nhận trong CRM</small></div></header>
        <div className={styles.sources}>
          {total > 0 ? sources.map((source,i)=><div className={styles.source} key={source.label}><div className={styles.sourceTop}><span>{source.label}</span><b>{source.count} · {Math.round(source.count / total * 100)}%</b></div><div className={styles.track}><div style={{width:`${source.count/total*100}%`,background:palette[i%palette.length]}}/></div></div>) : <p className={styles.empty}>Chưa có dữ liệu nguồn lead.</p>}
        </div>
      </div>
    </div>
    <div className={styles.panel} style={{ marginTop: 14 }}>
      <header><div><strong>Cơ cấu trạng thái đơn hàng</strong><small>Đếm đơn theo trạng thái hiện hành, không gộp tiền tệ</small></div></header>
      <div className={styles.sources} role="list" aria-label="Phân bổ đơn hàng theo trạng thái">
        {statuses.length ? statuses.map((item, i) => {
          const all = statuses.reduce((sum, row) => sum + row.count, 0);
          return <div role="listitem" key={item.label} className={styles.source}>
            <div className={styles.sourceTop}><span>{item.label}</span><b>{item.count} đơn · {all ? Math.round(item.count / all * 100) : 0}%</b></div>
            <div className={styles.track}><div style={{ width: `${all ? item.count / all * 100 : 0}%`, background: palette[i % palette.length] }}/></div>
          </div>;
        }) : <p className={styles.empty}>Chưa có đơn hàng.</p>}
      </div>
    </div>
    <p className={styles.note}>Phạm vi biểu đồ: Owner. Thống kê đếm bản ghi hiện có trong database, không lấy số liệu minh họa từ HTML V9. Các báo cáo tiền tệ sẽ được bổ sung sau khi xác minh chuẩn quy đổi.</p>
  </section>;
}
