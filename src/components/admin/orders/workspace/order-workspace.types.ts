export type OrderWorkspaceTab =
  | "products"
  | "qc"
  | "documents"
  | "info"
  | "delivery"
  | "payment"
  | "activity"
  | "notes";

export const ORDER_WORKSPACE_TABS: Array<{ key: OrderWorkspaceTab; label: string; financialOnly?: boolean; productionOnly?: boolean }> = [
  { key: "products", label: "Sản phẩm" },
  { key: "qc", label: "Sản xuất / QC", productionOnly: true },
  { key: "documents", label: "Tài liệu" },
  { key: "info", label: "Thông tin đơn" },
  { key: "delivery", label: "Giao hàng" },
  { key: "payment", label: "Thanh toán", financialOnly: true },
  { key: "activity", label: "Hoạt động" },
  { key: "notes", label: "Ghi chú" },
];

export function orderWorkspaceTabStorageKey(orderId: string) {
  return `order-workspace-tab:${orderId}`;
}

export function orderWorkspaceSectionStorageKey(orderId: string) {
  return `order-workspace-sections:${orderId}`;
}
