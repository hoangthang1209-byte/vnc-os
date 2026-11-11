"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Link2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAdminPermissions, type AdminPermissionFlags } from "@/components/admin/AdminPermissionsContext";
import {
  getRecordModuleShortcuts,
  type LinkedRecordType,
} from "@/lib/admin/record-links";
import styles from "./AdminConnectedRecords.module.css";

const modulePermissions: Record<LinkedRecordType, keyof AdminPermissionFlags> = {
  customer: "canViewCrm",
  quote: "canAccessQuotes",
  order: "canViewOrders",
  project: "canManageUsers",
  supplier: "canViewProduction",
  invoice: "canViewFinancials",
  techPack: "canViewProduction",
};

/**
 * Contextual, read-only cross-module navigation.
 * Does not infer/construct record-detail URLs and does not expose IDs.
 * Destination APIs remain responsible for authorization.
 */
export default function AdminConnectedRecords() {
  const pathname = usePathname();
  const { permissions, loading } = useAdminPermissions();
  const [open, setOpen] = useState(false);

  if (loading) return null;

  const applicable = pathname.startsWith("/admin/orders") ||
    pathname.startsWith("/admin/crm") ||
    pathname.startsWith("/admin/quotes") ||
    pathname.startsWith("/admin/documents/invoices") ||
    pathname.startsWith("/admin/production-suppliers") ||
    pathname.startsWith("/admin/tech-pack");

  if (!applicable) return null;

  const routes: LinkedRecordType[] = [
    "customer", "quote", "order", "project", "supplier", "invoice", "techPack",
  ];
  const visible = getRecordModuleShortcuts(routes)
    .filter((record) => permissions[modulePermissions[record.type]])
    .filter((record) => pathname !== record.href);

  if (visible.length === 0) return null;

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls="admin-v9-connected-records"
        onClick={() => setOpen((value) => !value)}
      >
        <Link2 size={15} aria-hidden="true" />
        <span>Liên kết nghiệp vụ</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open ? (
        <div className={styles.popover} id="admin-v9-connected-records" role="region" aria-label="Đi tới module liên quan">
          <p className={styles.heading}>Chuyển nhanh đến</p>
          <div className={styles.items}>
            {visible.map((record) => (
              <Link key={record.type} href={record.href} className={styles.item} onClick={() => setOpen(false)}>
                {record.label}
              </Link>
            ))}
          </div>
          <p className={styles.note}>Chỉ hiển thị module được phân quyền. Chưa liên kết đến từng bản ghi.</p>
        </div>
      ) : null}
    </div>
  );
}
