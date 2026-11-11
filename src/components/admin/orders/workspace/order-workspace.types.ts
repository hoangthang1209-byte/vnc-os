export type OrderWorkspaceTab =
  | "products"
  | "qc"
  | "documents"
  | "info"
  | "delivery"
  | "payment"
  | "activity"
  | "notes";

export const ORDER_WORKSPACE_TABS: Array<{ key: OrderWorkspaceTab; label: string; financialOnly?: boolean; productionOnly?: boolean; deliveryOnly?: boolean }> = [
  { key: "products", label: "Sản phẩm" },
  { key: "qc", label: "Sản xuất / QC", productionOnly: true },
  { key: "documents", label: "Tài liệu" },
  { key: "info", label: "Thông tin đơn" },
  { key: "delivery", label: "Giao hàng", deliveryOnly: true },
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

/** Visible tab configuration for a session; server API permissions remain authoritative. */
export function visibleOrderWorkspaceTabs(access: {
  canViewFinancials: boolean;
  canViewProduction: boolean;
  canViewDelivery: boolean;
}) {
  return ORDER_WORKSPACE_TABS.filter(
    (tab) =>
      (!tab.financialOnly || access.canViewFinancials) &&
      (!tab.productionOnly || access.canViewProduction) &&
      (!tab.deliveryOnly || access.canViewDelivery),
  );
}

export function authorizedDefaultOrderTab(
  roleCode: string | null,
  tabs: ReturnType<typeof visibleOrderWorkspaceTabs>,
): OrderWorkspaceTab {
  const preferred: OrderWorkspaceTab = roleCode === "DELIVERY" ? "delivery" : "products";
  return tabs.some((tab) => tab.key === preferred) ? preferred : (tabs[0]?.key ?? "products");
}
