"use client";

import { useMemo, useState } from "react";
import type { CustomerAccountOverview } from "@/features/crm/customer-account-overview.types";
import styles from "./V9CustomerOrderChart.module.css";

type Period = 6 | 12;
type Display = "bar" | "line";

export function bucketOrdersByMonth(
  rows: Pick<CustomerAccountOverview["orders"][number], "orderDate">[],
  now: Date,
  months: number,
) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months + 1, 1));
  const result = Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth(), label: `T${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`, count: 0 };
  });
  const map = new Map(result.map((item, i) => [`${item.year}-${item.month}`, i]));
  for (const row of rows) {
    const date = new Date(row.orderDate);
    if (!Number.isFinite(date.getTime())) continue;
    const position = map.get(`${date.getUTCFullYear()}-${date.getUTCMonth()}`);
    if (position !== undefined) result[position].count++;
  }
  return result;
}

/** Only shows order counts, not private order value/margin. Never claims full financial history. */
export default function V9CustomerOrderChart({ overview }: { overview: CustomerAccountOverview }) {
  const [period, setPeriod] = useState<Period>(6);
  const [display, setDisplay] = useState<Display>("bar");
  const rows = useMemo(() => bucketOrdersByMonth(overview.orders, new Date(), period), [overview.orders, period]);
  const max = Math.max(1, ...rows.map((row) => row.count));
  const left = 35, right = 12, top = 14, bottom = 35, width = 680, height = 230;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const x = (index: number) => left + (index + 0.5) * plotWidth / rows.length;
  const y = (count: number) => top + plotHeight * (1 - count / max);
  const polyline = rows.map((r, i) => `${x(i)},${y(r.count)}`).join(" ");

  return (
    <section className={styles.card} aria-label="Biểu đồ đơn hàng theo tháng">
      <div className={styles.heading}>
        <div><strong>Xu hướng đơn hàng</strong><p>Đơn hàng đã ghi nhận trong dữ liệu Customer 360</p></div>
        <div className={styles.filters}>
          <div className={styles.segment} role="group" aria-label="Khoảng thời gian">
            {([6, 12] as const).map((n) => <button type="button" key={n} aria-pressed={period === n} className={period === n ? styles.chosen : ""} onClick={() => setPeriod(n)}>{n} tháng</button>)}
          </div>
          <div className={styles.segment} role="group" aria-label="Kiểu biểu đồ">
            <button type="button" aria-pressed={display === "bar"} className={display === "bar" ? styles.chosen : ""} onClick={() => setDisplay("bar")}>Cột</button>
            <button type="button" aria-pressed={display === "line"} className={display === "line" ? styles.chosen : ""} onClick={() => setDisplay("line")}>Đường</button>
          </div>
        </div>
      </div>
      <div className={styles.plot}>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Số đơn mỗi tháng: ${rows.map((r) => `${r.label}: ${r.count}`).join("; ")}`}>
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const yy = top + plotHeight * (1 - fraction);
            return <g key={fraction}><line x1={left} y1={yy} x2={width-right} y2={yy} stroke="#eaf0f5"/><text x={left-7} y={yy+3} textAnchor="end" fill="#8593a5" fontSize="10">{(max*fraction).toFixed(max <= 4 ? 1 : 0)}</text></g>;
          })}
          {display === "bar" ? rows.map((r, i) => {
            const barWidth = Math.min(34, plotWidth / rows.length * 0.6), yy = y(r.count);
            return <rect key={r.label} x={x(i)-barWidth/2} y={yy} width={barWidth} height={Math.max(0, top+plotHeight-yy)} rx="4" fill={i===rows.length-1?"#d92f3a":"#9db6cf"}><title>{r.label}: {r.count} đơn</title></rect>;
          }) : <><polyline points={polyline} fill="none" stroke="#d92f3a" strokeWidth="3" strokeLinejoin="round"/>{rows.map((r,i)=><circle key={r.label} cx={x(i)} cy={y(r.count)} r="4" fill="#fff" stroke="#d92f3a" strokeWidth="2"><title>{r.label}: {r.count} đơn</title></circle>)}</>}
          {rows.map((r,i)=><text key={r.label} x={x(i)} y={height-13} textAnchor="middle" fill="#8593a5" fontSize={period===12?"9":"11"}>{period===12?`T${r.month+1}`:r.label}</text>)}
        </svg>
      </div>
      <p className={styles.note}>Chỉ tính các đơn hàng được tải trong hồ sơ (tối đa {overview.orders.length} bản ghi). Không suy diễn đây là toàn bộ lịch sử khi có nhiều hơn số bản ghi đã tải. Không bao gồm giá trị đơn hoặc dữ liệu demo.</p>
    </section>
  );
}
