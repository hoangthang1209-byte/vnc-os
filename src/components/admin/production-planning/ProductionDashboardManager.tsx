"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdminErrorRecovery from "@/components/admin/feedback/AdminErrorRecovery";
import AdminPageSkeleton from "@/components/admin/feedback/AdminPageSkeleton";
import type { ProductionDashboardResponse } from "@/features/production-planning/production-plan.types";
import V9ProductionPulse from "./V9ProductionPulse";
import V9ProductionActionQueue from "./V9ProductionActionQueue";

export default function ProductionDashboardManager() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ProductionDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const legacySearch = searchParams.get("search");

  useEffect(() => {
    // Initial state is already loading; avoid synchronous setState in effect.
    void fetch("/api/production/dashboard")
      .then((r) => r.json())
      .then((body: ProductionDashboardResponse & { message?: string }) => {
        if (!body.sections) throw new Error(body.message ?? "Không thể tải tổng quan sản xuất");
        setData(body);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminPageSkeleton message="Đang tải tổng quan sản xuất…" />;
  if (error || !data) {
    return <AdminErrorRecovery message={error ?? "Không thể tải tổng quan sản xuất"} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="prod-dash">
      <header className="prod-dash__header" aria-label="Điều hành sản xuất">
        <div>
          <h1 className="prod-dash__title">Điều hành sản xuất</h1>
          <p className="prod-dash__subtitle">Theo dõi công việc, hạn chót và tải sản xuất hôm nay</p>
        </div>
        <div className="prod-dash__nav">
          <Link href="/admin/production/plan" className="admin-btn admin-btn--primary admin-btn--small">
            Kế hoạch sản xuất
          </Link>
          <Link href="/admin/production/board" className="admin-btn admin-btn--secondary admin-btn--small">
            Bảng tiến độ
          </Link>
        </div>
      </header>

      <V9ProductionPulse data={data} />

      {legacySearch && (
        <div className="prod-dash__legacy-hint">
          Tìm theo đơn: <strong>{legacySearch}</strong> —{" "}
          <Link href={`/admin/production/plan?search=${encodeURIComponent(legacySearch)}`}>
            Mở trong kế hoạch sản xuất
          </Link>
        </div>
      )}

      <V9ProductionActionQueue data={data} />
    </div>
  );
}
