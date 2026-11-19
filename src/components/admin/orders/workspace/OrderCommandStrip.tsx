"use client";

import type { OrderDetailRecord } from "@/features/orders/order.types";
import styles from "./OrderCommandStrip.module.css";

type Props = { order: OrderDetailRecord; canViewFinancials: boolean };
const number = (value: number) => value.toLocaleString("vi-VN");
const marketCode = (sku: string | null) => sku?.match(/-(KUL|JKT|MNL|KHH)$/)?.[1];
export default function OrderCommandStrip({ order, canViewFinancials }: Props) {
  const stylesCount = new Set(order.items.map(item => item.productNameSnapshot?.trim() || item.skuSnapshot)).size;
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
  const values: { label: string; value: string; tone?: string; helper?: string }[] = [
    { label: "STYLES", value: number(stylesCount) },
    { label: "SKU LINES", value: number(order.items.length) },
    { label: "TOTAL QTY", value: number(quantity), helper: "pcs" },
    { label: "MARKETS", value: number(markets.size) },
    { label: "UNALLOCATED", value: number(unallocated), tone: unallocated ? "warning" : undefined, helper: "pcs" },
    ...(canViewFinancials ? [{ label: "ORDER VALUE", value: order.internalNote?.includes("NO CUSTOMER SELLING PRICES") && order.totalAmount === 0 ? "Pending pricing" : `${number(order.totalAmount)} ${order.currency}`, helper: order.internalNote?.includes("NO CUSTOMER SELLING PRICES") && order.totalAmount === 0 ? "Not a zero-value sale" : undefined }] : []),
  ];
  return <section className={styles.strip} aria-label="Order operating summary" data-testid="v9-order-command-strip">
    <div className={styles.identity}><span className={styles.small}>CUSTOMER / PROJECT</span><strong>{order.customerCompanyName || order.customer?.name || "—"}</strong><small>{order.orderNo} · {order.status}</small></div>
    {values.map(metric => <div className={styles.metric} key={metric.label}><span>{metric.label}</span><strong className={metric.tone === "warning" ? styles.warning : ""}>{metric.value}</strong>{metric.helper && <small>{metric.helper}</small>}</div>)}
  </section>;
}
