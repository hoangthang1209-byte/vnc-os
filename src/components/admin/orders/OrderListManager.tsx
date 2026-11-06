"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { useAdminPermissions } from "@/components/admin/AdminPermissionsContext";
import AdminErrorRecovery from "@/components/admin/feedback/AdminErrorRecovery";
import AdminInlineLoader from "@/components/admin/feedback/AdminInlineLoader";
import AdminPageSkeleton from "@/components/admin/feedback/AdminPageSkeleton";
import AdminLoadingButton from "@/components/admin/feedback/AdminLoadingButton";
import {
  ORDER_PAYMENT_STATE_LABELS,
  ORDER_STATUS_LABELS,
  type OrderPaymentStateFilter,
} from "@/features/orders/order-labels";
import type {
  OrderListDashboardResponse,
  OrderListKpiKey,
  OrderListQuickFilter,
} from "@/features/orders/order-list-dashboard.types";
import { SlidersHorizontal } from "lucide-react";
import V9OrderOperations, { type OrderV9View } from "./V9OrderOperations";
import V9OrderTable from "./V9OrderTable";
import orderV9Styles from "./OrderListV9.module.css";
import { useAdminListQuery } from "@/hooks/useAdminListQuery";

function kpiDisplayLabel(label: string, key: OrderListKpiKey): string {
  if (key === "at_risk") return "Nguy cơ trễ";
  return label;
}


function useListFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") ?? "",
      customerId: searchParams.get("customerId") ?? "",
      status: (searchParams.get("status") as OrderStatus | null) ?? "",
      paymentState: (searchParams.get("paymentState") as OrderPaymentStateFilter | null) ?? "",
      quickFilter: (searchParams.get("quickFilter") as OrderListQuickFilter | null) ?? "all",
      kpi: (searchParams.get("kpi") as OrderListKpiKey | null) ?? "",
      mine: searchParams.get("mine") === "1",
      page: Number(searchParams.get("page") ?? "1") || 1,
    }),
    [searchParams],
  );

  const update = useCallback(
    (next: Partial<typeof filters>) => {
      const params = new URLSearchParams(searchParams.toString());
      const merged = { ...filters, ...next };
      for (const [key, value] of Object.entries(merged)) {
        if (key === "page" && (!value || value === 1)) {
          params.delete("page");
          continue;
        }
        if (key === "mine") {
          if (value) params.set("mine", "1");
          else params.delete("mine");
          continue;
        }
        if (!value || value === "all" || value === "") params.delete(key);
        else params.set(key, String(value));
      }
      if (next.kpi !== undefined || next.quickFilter !== undefined) {
        if (next.kpi) {
          params.delete("quickFilter");
        }
        if (next.quickFilter && next.quickFilter !== "all") {
          params.delete("kpi");
        }
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [filters, pathname, router, searchParams],
  );

  return { filters, update };
}

function buildQueryString(filters: ReturnType<typeof useListFilters>["filters"]) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.customerId.trim()) params.set("customerId", filters.customerId.trim());
  if (filters.status) params.set("status", filters.status);
  if (filters.paymentState) params.set("paymentState", filters.paymentState);
  if (filters.quickFilter && filters.quickFilter !== "all") {
    params.set("quickFilter", filters.quickFilter);
  }
  if (filters.kpi) params.set("kpi", filters.kpi);
  if (filters.mine) params.set("mine", "1");
  if (filters.page > 1) params.set("page", String(filters.page));
  return params.toString();
}



function kpiToneClass(tone: string) {
  return `order-ops-kpi order-ops-kpi--${tone}`;
}





export default function OrderListManager() {
  const { permissions, mode } = useAdminPermissions();
  const { filters, update } = useListFilters();
  const [searchInput, setSearchInput] = useState(filters.search);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [v9View, setV9View] = useState<OrderV9View>("table");

  useEffect(() => {
    const task = Promise.resolve().then(() => setSearchInput(filters.search));
    void task;
  }, [filters.search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput !== filters.search) {
        update({ search: searchInput, page: 1 });
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [filters.search, searchInput, update]);

  const queryString = buildQueryString(filters);
  const query = useAdminListQuery<OrderListDashboardResponse>(
    `orders-dashboard:${queryString}`,
    `/api/orders/dashboard?${queryString}`,
  );

  const data = query.data;
  const orders = data?.orders ?? [];
  const summary = data?.summary;
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 50;
  const page = data?.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canViewFinancials = data?.permissions.canViewFinancials ?? permissions.canViewFinancials;
  const canCreateOrders = data?.permissions.canCreateOrders ?? permissions.canCreateOrders;
  const canViewCrm = permissions.canViewCrm;
  const customerFilter = data?.customerFilter ?? null;

  const activeQuick =
    filters.kpi ? null : filters.mine ? "mine" : filters.quickFilter || "all";

  if (query.loading && !query.data) {
    return <AdminPageSkeleton message="Đang tải danh sách đơn hàng…" />;
  }

  return (
    <div className="order-ops-dashboard">
      <header className={orderV9Styles.heading}>
        <div>
          <p className={orderV9Styles.eyebrow}>VNC OS / SALES & OPERATIONS</p>
          <h1>Quản lý đơn hàng</h1>
          <p>Theo dõi tiến độ, sản xuất, QC, giao hàng và các việc cần xử lý.</p>
        </div>
        <div className={orderV9Styles.actions}>
          {canViewCrm && <Link href="/admin/crm/customers" className="admin-btn admin-btn--secondary">Khách hàng</Link>}
          {canCreateOrders && <Link href="/admin/orders/new/quick" className="admin-btn admin-btn--secondary">Nhập đơn nhanh</Link>}
          {canCreateOrders && <Link href="/admin/orders/new" className="admin-btn admin-btn--primary">+ Tạo đơn hàng</Link>}
        </div>
      </header>
      {summary && <div className="order-ops-kpi-grid" aria-label="Bộ lọc KPI toàn bộ đơn hàng theo phân quyền">
        {summary.kpis.map(kpi => <button key={kpi.key} type="button"
          className={`${kpiToneClass(kpi.tone)}${filters.kpi===kpi.key?" is-active":""}`}
          aria-pressed={filters.kpi===kpi.key}
          onClick={()=>update({kpi:filters.kpi===kpi.key?"":kpi.key,quickFilter:"all",mine:false,page:1})}>
          <span className="order-ops-kpi__label">{kpiDisplayLabel(kpi.label,kpi.key)}</span>
          <span className="order-ops-kpi__count">{kpi.count}</span>
        </button>)}
      </div>}
      {data && <V9OrderOperations rows={orders} total={total} queryString={queryString}
        view={v9View} onViewChange={setV9View}
        canCreateOrders={canCreateOrders} canViewProjects={mode === "owner"} />}
      <div className="order-ops-controls">
        <div className="order-ops-toolbar">
          <input
            className="admin-input order-ops-toolbar__search"
            placeholder="Tìm theo mã đơn, khách hàng, sản phẩm…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select
            className="admin-input order-ops-toolbar__select"
            value={filters.status}
            onChange={(e) => update({ status: e.target.value as OrderStatus | "", page: 1 })}
          >
            <option value="">Trạng thái</option>
            {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
            ))}
          </select>
          {canViewFinancials && (
            <select
              className="admin-input order-ops-toolbar__select order-ops-toolbar__select--payment"
              value={filters.paymentState}
              onChange={(e) =>
                update({ paymentState: e.target.value as OrderPaymentStateFilter | "", page: 1 })
              }
            >
              <option value="">Thanh toán</option>
              {(Object.keys(ORDER_PAYMENT_STATE_LABELS) as OrderPaymentStateFilter[]).map((s) => (
                <option key={s} value={s}>{ORDER_PAYMENT_STATE_LABELS[s]}</option>
              ))}
            </select>
          )}
          <button
            type="button"
            className={`admin-btn admin-btn--secondary admin-btn--small order-ops-toolbar__filter${advancedOpen ? " is-active" : ""}`}
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
          >
            <SlidersHorizontal size={14} aria-hidden />
            <span>Bộ lọc</span>
          </button>
          {query.refreshing && (
            <span className="order-ops-toolbar__refresh">
              <AdminInlineLoader message="Đang lọc…" />
            </span>
          )}
        </div>

        {filters.customerId && (
          <div className="order-ops-customer-filter" role="status">
            <span>
              Đang lọc theo khách hàng:{" "}
              <strong>
                {customerFilter
                  ? `${customerFilter.code} — ${customerFilter.name}`
                  : filters.customerId}
              </strong>
            </span>
            <div className="order-ops-customer-filter__actions">
              {canViewCrm && (
                <Link
                  href={`/admin/crm/customers/${filters.customerId}`}
                  className="admin-btn admin-btn--secondary admin-btn--xs"
                >
                  Mở khách hàng
                </Link>
              )}
              <button
                type="button"
                className="admin-btn admin-btn--secondary admin-btn--xs"
                onClick={() => update({ customerId: "", page: 1 })}
              >
                Bỏ lọc khách hàng
              </button>
            </div>
          </div>
        )}

        {advancedOpen && (
          <p className="order-ops-controls__hint admin-field-hint">
            Dùng thẻ KPI hoặc chip nhanh để lọc theo tình trạng vận hành.
          </p>
        )}

        {summary && (
          <div className="order-ops-chips">
            {summary.quickFilters.map((chip) => {
              const isActive =
                chip.key === "mine"
                  ? filters.mine
                  : chip.key === activeQuick && !filters.kpi;
              return (
                <button
                  key={chip.key}
                  type="button"
                  className={`order-ops-chip${isActive ? " is-active" : ""}`}
                  onClick={() => {
                    if (chip.key === "mine") {
                      update({ mine: !filters.mine, kpi: "", quickFilter: "all", page: 1 });
                      return;
                    }
                    update({
                      quickFilter: chip.key,
                      kpi: "",
                      mine: false,
                      page: 1,
                    });
                  }}
                >
                  {chip.label}
                  {chip.count != null && (
                    <span className="order-ops-chip__count">{chip.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {query.error && (
        <AdminErrorRecovery
          message="Không thể tải danh sách đơn hàng. Vui lòng thử lại."
          onRetry={() => void query.reload()}
        />
      )}

      {!query.error && orders.length === 0 && !query.loading && (
        <div className="order-ops-empty">
          <p>
            {filters.search || filters.status || filters.kpi || filters.quickFilter !== "all" || filters.mine
              ? "Không tìm thấy đơn hàng phù hợp."
              : "Chưa có đơn hàng."}
          </p>
        </div>
      )}

      {v9View === "table" && orders.length > 0 && (
        <>
          <V9OrderTable rows={orders} queryString={queryString} canViewCrm={canViewCrm} refreshing={query.refreshing} />

          <footer className={`order-ops-pagination${totalPages <= 1 ? " order-ops-pagination--single" : ""}`}>
            <span className="order-ops-pagination__meta">
              Trang {page}/{totalPages} · {total.toLocaleString("vi-VN")} đơn
            </span>
            {totalPages > 1 && (
              <div className="order-ops-pagination__actions">
                <AdminLoadingButton
                  type="button"
                  variant="secondary"
                  size="small"
                  disabled={page <= 1 || query.refreshing}
                  pending={query.refreshing}
                  onClick={() => update({ page: page - 1 })}
                >
                  Trước
                </AdminLoadingButton>
                <AdminLoadingButton
                  type="button"
                  variant="secondary"
                  size="small"
                  disabled={page >= totalPages || query.refreshing}
                  pending={query.refreshing}
                  onClick={() => update({ page: page + 1 })}
                >
                  Sau
                </AdminLoadingButton>
              </div>
            )}
          </footer>
        </>
      )}
    </div>
  );
}
