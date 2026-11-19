"use client";

import type { OrderDetailRecord } from "@/features/orders/order.types";
import styles from "./OrderCommandStrip.module.css";

type Props = { order: OrderDetailRecord; canViewFinancials: boolean };
const number = (value: number) => value.toLocaleString("vi-VN");
const marketCode = (sku: string | null) => sku?.match(/-(KUL|JKT|MNL|KHH)$/)?.[1];
export default function OrderCommandStrip({ order, canViewFinancials }: Props) {
  const stylesCount = new Set(order.items.map(item => item.skuSnapshot?.replace(/-(KUL|JKT|MNL|KHH)$/, "") || item.productNameSnapshot?.trim())).size;
  const markets = new Set(order.items.map(item => marketCode(item.skuSnapshot)).filter(Boolean));
  const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const unallocated = order.items.reduce((sum, item) => {
    const variants = item.variants;
    if (!variants.length) return sum; // non-sized goods: not missing sizes
    const explicit = variants.filter(v => /^(UNALLOCATED|CHƯA CHIA SIZE)$/i.test((v.sizeValue ?? "").trim()))
      .reduce((value, v) => value + v.quantity, 0);
    const remaining = Math.max(0, item.quantity - variants.reduce((value, v) => value + v.quantity, 0));
    return sum + explicit + remaining;
  }, 0);
  // Essential operating facts only; financials and detail are in their own tabs.
  const values: { label: string; value: string; tone?: string; helper?: string }[] = [
    { label: "STYLES", value: number(stylesCount) },
    { label: "SKU", value: number(order.items.length) },
    { label: "TOTAL QTY", value: number(quantity), helper: "pcs" },
    { label: "MARKETS", value: number(markets.size) },
    ...(unallocated > 0 ? [{ label: "SIZE PENDING", value: number(unallocated), tone: "warning", helper: "pcs" }] : []),
  ];
  void canViewFinancials;
  return <section className={styles.strip} aria-label="Order operating summary" data-testid="v9-order-command-strip">
    <div className={styles.identity}><span className={styles.small}>CUSTOMER / PROJECT</span><strong>{order.customerCompanyName || order.customer?.name || "—"}</strong><small>{order.orderNo}</small></div>
    {values.map(metric => <div className={styles.metric} key={metric.label}><span>{metric.label}</span><strong className={metric.tone === "warning" ? styles.warning : ""}>{metric.value}</strong>{metric.helper && <small>{metric.helper}</small>}</div>)}
  </section>;
}
