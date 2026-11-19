"use client";

import { useEffect, useState } from "react";
import type { ProductionDashboardResponse } from "@/features/production-planning/production-plan.types";
import V9ProductionActionQueue from "@/components/admin/production-planning/V9ProductionActionQueue";

/**
 * Preserve the permission-scoped task queue from the retired production overview.
 * The endpoint is an existing read-only GET; this widget never infers global KPIs.
 */
export default function OperationsV9ActionQueue() {
  const [data, setData] = useState<ProductionDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/production/dashboard", {
          signal: controller.signal,
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Không tải được công việc (HTTP ${response.status})`);
        const body: ProductionDashboardResponse = await response.json();
        if (!Array.isArray(body.sections) || !Array.isArray(body.myJobs) ||
            !Array.isArray(body.upcomingDeadlines)) {
          throw new Error("Phản hồi danh sách sản xuất không hợp lệ");
        }
        if (!controller.signal.aborted) { setData(body); setError(null); }
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "Không tải được công việc sản xuất");
      }
    }
    void load();
    return () => controller.abort();
  }, [refreshKey]);

  if (error) {
    return <section className="v9panel v9panelpad" role="alert">
      <strong>Không tải được danh sách công việc theo phân quyền</strong>
      <p className="v9hint">{error}</p>
      <button type="button" className="v9btn" onClick={() => { setData(null); setError(null); setRefreshKey(v => v + 1); }}>Thử lại</button>
    </section>;
  }

  if (!data) return <section className="v9panel v9panelpad" aria-busy="true">Đang tải công việc được giao và hạn sắp tới…</section>;

  return <V9ProductionActionQueue data={data} />;
}
