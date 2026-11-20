"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./ProductionModuleNav.module.css";

const items = [
  { label: "Master Gantt", href: "/admin/operations-v9", match: "/admin/operations-v9" },
  { label: "Kế hoạch SX", href: "/admin/production/plan", match: "/admin/production/plan" },
  { label: "Tiến độ", href: "/admin/manufacturing/production-timeline", match: "/admin/manufacturing/production-timeline" },
  { label: "Production Board", href: "/admin/production/board", match: "/admin/production/board" },
  { label: "Tech Pack", href: "/admin/tech-pack", match: "/admin/tech-pack" },
  { label: "Rập / Thông số", href: "/admin/pattern", match: "/admin/pattern" },
  { label: "Nguyên phụ liệu", href: "/admin/production-materials", match: "/admin/production-materials" },
  { label: "Xưởng / SRM", href: "/admin/production-suppliers", match: "/admin/production-suppliers" },
  { label: "Giao hàng", href: "/admin/delivery", match: "/admin/delivery" },
] as const;

/** Shared cross-module navigation; never modifies production data or auth scope. */
export default function ProductionModuleNav() {
  const pathname = usePathname();
  return <nav className={styles.root} aria-label="Production module navigation">
    <div className={styles.heading}><strong>OPERATIONS</strong><span>Project → PO → Production → Shipment</span></div>
    <div className={styles.scroll}>
      {items.map(item => <Link key={item.href} href={item.href}
        className={`${styles.link} ${pathname === item.match || pathname.startsWith(item.match + "/") ? styles.active : ""}`}
        aria-current={pathname === item.match || pathname.startsWith(item.match + "/") ? "page" : undefined}>
        {item.label}
      </Link>)}
    </div>
  </nav>;
}
