/**
 * VNC OS V9 — safe, typed cross-module record navigation.
 *
 * This registry intentionally links to existing LIST routes. Detail-route shapes
 * differ across VNC OS modules, so V9 must not guess or generate detail URLs.
 * Callers supply only business identifiers for display; server-side permissions
 * and query filtering must be enforced by each destination module.
 */
export const recordModuleRoutes = {
  customer: "/admin/crm/customers",
  quote: "/admin/quotes",
  order: "/admin/orders",
  project: "/admin/orders/projects",
  supplier: "/admin/production-suppliers",
  invoice: "/admin/documents/invoices",
  techPack: "/admin/tech-pack",
} as const;

export type LinkedRecordType = keyof typeof recordModuleRoutes;

export type LinkedRecordRef = Readonly<{
  type: LinkedRecordType;
  id: string;
  label: string;
}>;

export type LinkedRecordShortcut = Readonly<{
  type: LinkedRecordType;
  label: string;
  href: string;
}>;

const titles: Record<LinkedRecordType, string> = {
  customer: "Khách hàng",
  quote: "Báo giá",
  order: "Đơn hàng",
  project: "Dự án",
  supplier: "Nhà cung cấp",
  invoice: "Invoice",
  techPack: "Tech Pack",
};

/** No user-provided path components or query params are accepted. */
export function getRecordModuleShortcut(type: LinkedRecordType): LinkedRecordShortcut {
  return { type, label: titles[type], href: recordModuleRoutes[type] };
}

/** Reject invalid runtime values rather than generating misleading routes. */
export function isLinkedRecordType(value: string): value is LinkedRecordType {
  return Object.prototype.hasOwnProperty.call(recordModuleRoutes, value);
}

export function getRecordModuleShortcuts(
  types: readonly LinkedRecordType[],
): LinkedRecordShortcut[] {
  const seen = new Set<LinkedRecordType>();
  return types.filter((type) => {
    if (seen.has(type)) return false;
    seen.add(type);
    return true;
  }).map(getRecordModuleShortcut);
}
