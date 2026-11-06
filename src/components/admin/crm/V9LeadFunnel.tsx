"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./V9LeadFunnel.module.css";

type FunnelStage = {
  key: string;
  label: string;
  count: number;
  rateFromPrevious: number | null;
  rateFromReceived: number | null;
};
type FunnelPayload = {
  days: 7 | 30 | 90;
  scope: "owner" | "assigned";
  stages: FunnelStage[];
  generatedAt: string;
  disclaimer: string;
};

export default function V9LeadFunnel() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [payload, setPayload] = useState<FunnelPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    // Only asynchronous fetch completion updates state. No synchronous setter
    // is invoked from the effect, avoiding react-hooks/set-state-in-effect.
    fetch(`/api/admin/v9/lead-funnel?days=${days}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            response.status === 403 ? "Bạn không có quyền xem dữ liệu phễu Lead."
              : response.status === 401 ? "Cần đăng nhập để xem biểu đồ."
              : "Không thể tải dữ liệu phễu Lead.",
          );
        }
        return response.json() as Promise<FunnelPayload>;
      })
      .then((result) => {
        if (controller.signal.aborted) return;
        setPayload(result);
        setError("");
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "Không thể tải phễu Lead.");
        setPayload(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [days]);

  const selectDays = (value: 7 | 30 | 90) => {
    if (days === value) return;
    setLoading(true);
    setDays(value);
  };

  const stages = payload?.stages ?? [];
  const max = Math.max(1, stages[0]?.count ?? 1);
  return (
    <section className={styles.root} aria-label="Phễu chuyển đổi Lead đến đơn hàng" data-testid="v9-lead-funnel">
      <div className={styles.head}>
        <div><strong>Lead → Đơn hàng</strong><p>Phễu chuyển đổi B2B · dữ liệu CRM và báo giá thực</p></div>
        <div className={styles.period} role="group" aria-label="Khoảng thời gian của phễu">
          {([7, 30, 90] as const).map((value) => <button type="button" key={value} aria-pressed={days === value}
            className={days === value ? styles.selected : ""} onClick={() => selectDays(value)}>{value} ngày</button>)}
        </div>
      </div>
      <div className={styles.body}>
        {loading ? <p role="status" className={styles.feedback}>Đang tải phễu Lead...</p> : error ? <p role="alert" className={styles.error}>{error}</p> :
          <div className={styles.funnel}>
            {stages.map((stage, index) => (
              <div key={stage.key} className={styles.stepWrap}>
                <div className={styles.step} style={{ width: `${60 + 40 * stage.count / max}%`, background: ["#31577b", "#416a8e", "#5581a5", "#b17f63", "#d64853"][index] }}>
                  <span>{stage.label}</span><strong>{stage.count.toLocaleString("vi-VN")}</strong>
                  <small>{index === 0 ? "100% cohort" : stage.rateFromPrevious == null ? "—" : `${stage.rateFromPrevious}% từ bước trước`}</small>
                </div>
                {index < stages.length - 1 && <span aria-hidden="true" className={styles.arrow}>↓</span>}
              </div>
            ))}
            {stages.length === 0 && <p className={styles.feedback}>Không có dữ liệu.</p>}
          </div>}
      </div>
      <footer className={styles.foot}>
        <p>{payload?.disclaimer || "Mọi tỷ lệ đều được tính từ các bản ghi CRM có truy vết."} {payload?.scope === "assigned" ? "Chỉ hiển thị lead được giao cho bạn." : ""}</p>
        <Link href="/admin/crm/leads">Mở danh sách Lead →</Link>
      </footer>
    </section>
  );
}
