"use client";

import type { OrderDetailRecord } from "@/features/orders/order.types";
import type { OrderWorkspaceTab } from "./order-workspace.types";

type Props = {
  order: OrderDetailRecord;
  onNavigateTab: (tab: OrderWorkspaceTab) => void;
  canViewFinancials: boolean;
};

/**
 * Workbook-inspired operational control strip. All numbers are computed from
 * the existing Order record; no new source of truth or invented FOC quantities.
 */
export default function OrderExecutionControl({ order, onNavigateTab, canViewFinancials }: Props) {
  const ordered = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const variantTotal = order.items.reduce(
    (sum, item) => sum + item.variants.reduce((n, variant) => n + variant.quantity, 0),
    0,
  );
  const unbalancedItems = order.items.filter(
    (item) => item.variants.length > 0 &&
      item.variants.reduce((n, variant) => n + variant.quantity, 0) !== item.quantity,
  );
  const tasks: Array<{ label: string; done: boolean; tab: OrderWorkspaceTab }> = [
    { label: "Khách hàng", done: Boolean(order.customerId), tab: "info" },
    { label: "Danh sách sản phẩm", done: order.items.length > 0, tab: "products" },
    { label: "Phân bổ size", done: order.items.length > 0 && order.items.every((item) => item.variants.length > 0) && unbalancedItems.length === 0, tab: "products" },
    { label: "Phụ trách sản xuất", done: Boolean(order.productionOwnerId), tab: "info" },
    { label: "Hạn sản xuất", done: Boolean(order.productionDueDate), tab: "info" },
    { label: "Thông tin giao hàng", done: Boolean(order.deliveryAddress || order.deliveryRecipientName), tab: "delivery" },
  ];
  const remaining = tasks.filter((task) => !task.done).length;
  const pendingTasks = tasks.filter((task) => !task.done);

  return (
    <section className="admin-card" aria-label="Kiểm soát thực hiện đơn hàng" style={{ padding: 16, marginBlock: 16 }}>
      <div style={{ display: "flex", gap: 16, justifyContent: "space-between", flexWrap: "wrap", alignItems: "start" }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Kiểm soát thực hiện đơn hàng</h2>
          <p style={{ margin: "6px 0 0", opacity: 0.75, fontSize: 13 }}>
            Một đơn hàng, một nguồn dữ liệu. Các số lượng bên dưới lấy từ đơn hiện tại, không cộng FOC hay hao hụt dự kiến.
          </p>
        </div>
        <span role="status" style={{ fontWeight: 600, fontSize: 13 }}>
          {remaining === 0 ? "Đủ thông tin cơ bản" : `Cần hoàn thiện ${remaining} mục`}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBlock: 16 }}>
        <div style={{ minWidth: 125 }}><div style={{ fontSize: 12, opacity: 0.7 }}>SKU / dòng hàng</div><strong>{order.items.length.toLocaleString("vi-VN")}</strong></div>
        <div style={{ minWidth: 125 }}><div style={{ fontSize: 12, opacity: 0.7 }}>Số lượng đặt</div><strong>{ordered.toLocaleString("vi-VN")}</strong></div>
        <div style={{ minWidth: 125 }}><div style={{ fontSize: 12, opacity: 0.7 }}>Đã phân size</div><strong>{variantTotal.toLocaleString("vi-VN")}</strong></div>
        {canViewFinancials && <div style={{ minWidth: 125 }}><div style={{ fontSize: 12, opacity: 0.7 }}>Giá trị đơn</div><strong>{order.totalAmount.toLocaleString("vi-VN")} {order.currency}</strong></div>}
      </div>
      {unbalancedItems.length > 0 && (
        <p role="alert" style={{ fontSize: 13, marginBottom: 12 }}>
          Có {unbalancedItems.length} dòng hàng có tổng phân size khác số lượng đặt. Kiểm tra trước khi chốt kế hoạch cắt.
        </p>
      )}
      {pendingTasks.length > 0 && (
        <div style={{ padding: "12px 14px", marginBottom: 12, border: "1px solid #fed7aa", background: "#fff7ed", borderRadius: 10 }}>
          <strong style={{ fontSize: 13 }}>Việc cần xử lý tiếp theo</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {pendingTasks.map((task) => (
              <button type="button" key={task.label} className="admin-btn admin-btn--secondary admin-btn--small" onClick={() => onNavigateTab(task.tab)}>
                Bổ sung {task.label.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      )}
      <details>
        <summary style={{ fontSize: 13, cursor: "pointer", marginBottom: 8 }}>Xem checklist đầy đủ ({tasks.length} mục)</summary>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tasks.map((task) => (
          <button
            type="button"
            key={task.label}
            className="admin-btn admin-btn--secondary admin-btn--small"
            aria-label={`${task.label}: ${task.done ? "đã có" : "cần bổ sung"}`}
            onClick={() => onNavigateTab(task.tab)}
          >
            {task.done ? "✓" : "○"} {task.label}
          </button>
        ))}
      </div>
      </details>
    </section>
  );
}
