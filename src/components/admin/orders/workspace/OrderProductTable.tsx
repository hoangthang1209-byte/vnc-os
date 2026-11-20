"use client";

import Link from "next/link";
import { useState } from "react";
import AdminInlineLoader from "@/components/admin/feedback/AdminInlineLoader";
import type { OrderDetailRecord, OrderItemRecord } from "@/features/orders/order.types";
import type { ProductionExecutionBundle } from "@/features/orders/production-execution.service";
import type { MaterialAvailabilityRow } from "@/features/materials/material-availability.service";
import {
  deriveDocumentStatus,
  deriveMaterialStatus,
  deriveProgressPercent,
  deriveQcStatus,
  findExecutionBundleForItem,
  mapReadinessToProgressBadge,
  PRODUCT_PROGRESS_LABELS,
} from "@/features/orders/order-workspace-status";
import styles from "./OrderSizeMatrix.module.css";
import OrderSkuEditor, { type OrderSkuEditTarget } from "./OrderSkuEditor";

type ItemMaterialRow = { orderItemId: string; materials: Array<{ id: string; materialType: string }> };
type Props = {
  order: OrderDetailRecord;
  bundle: ProductionExecutionBundle | null;
  itemMaterials: ItemMaterialRow[];
  materialRows: MaterialAvailabilityRow[];
  loading: boolean;
  canViewProduction: boolean;
  canEditOrder: boolean;
  onRefreshOrder?: () => Promise<void> | void;
  productionApprovals?: Record<string, { status: "PENDING" | "NEEDS_REVISION" | "RELEASED"; artworkStale: boolean }>;
};
type Mode = "style" | "market" | "all";
const SIZE_KEYS = ["S", "M", "L", "XL", "XXL", "UNALLOCATED"] as const;
const MARKET_LABELS: Record<string, string> = { KUL: "Kuala Lumpur", JKT: "Jakarta", MNL: "Manila", KHH: "Kaohsiung", OTHER: "Không phân thị trường" };
const format = (value: number) => value.toLocaleString("vi-VN");
const getMarket = (item: OrderItemRecord) => {
  const token = item.skuSnapshot?.match(/-([A-Z]{3})$/)?.[1] ?? "";
  return token in MARKET_LABELS && token !== "OTHER" ? token : "OTHER";
};
const styleKey = (item: OrderItemRecord) => item.skuSnapshot?.replace(/-([A-Z]{3})$/, "") || item.productNameSnapshot?.trim() || "Chưa đặt tên sản phẩm";
const getThumbnail = (items: OrderItemRecord[]) => items.find(item => item.designImageUrl?.trim())?.designImageUrl?.trim() || null;
function ProductThumbnail({ src, label, small = false, onAttach }: { src: string | null; label: string; small?: boolean; onAttach?: () => void }) {
  const [broken, setBroken] = useState(false);
  const safeSource = src && (/^https:\/\//i.test(src) || src.startsWith("/") && !src.startsWith("//")) ? src : null;
  const visible = safeSource && !broken;
  const thumbnail = (
    <span className={`${styles.thumbnail} ${small ? styles.thumbnailSmall : ""}`} title={visible ? `Ảnh sản phẩm: ${label}` : "Chưa có ảnh sản phẩm"}>
      {visible ? (
        // Order artwork URLs are managed in OrderItem.designImageUrl; avoid Next image remote-domain assumptions.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={safeSource} alt={`Thumbnail ${label}`} loading="lazy" onError={() => setBroken(true)} />
      ) : <span className={styles.thumbnailEmpty} aria-label="Chưa có ảnh sản phẩm">THÊM ẢNH</span>}
    </span>
  );
  return onAttach ? <button type="button" className={styles.thumbnailAction} onClick={onAttach} title={`Chọn hoặc thay ảnh cho ${label}`}>{thumbnail}</button> : thumbnail;
}
const normalizedSize = (value: string | null) => {
  const size = (value || "").trim().toUpperCase();
  return size === "CHƯA CHIA SIZE" ? "UNALLOCATED" : size;
};
function matrix(item: OrderItemRecord) {
  const sizes = new Map<string, number>();
  for (const variant of item.variants) {
    const key = normalizedSize(variant.sizeValue);
    if (!key) continue;
    sizes.set(key, (sizes.get(key) ?? 0) + variant.quantity);
  }
  const allocated = [...sizes.values()].reduce((sum, qty) => sum + qty, 0);
  const free = item.variants.length === 0 ? item.quantity : 0;
  const remaining = Math.max(0, item.quantity - allocated - free);
  if (remaining) sizes.set("UNALLOCATED", (sizes.get("UNALLOCATED") ?? 0) + remaining);
  return { sizes, free, remaining, mismatch: allocated + free > item.quantity };
}
function sumSizes(items: OrderItemRecord[], key: string) {
  return items.reduce((total, item) => total + (key === "FREE" ? matrix(item).free : matrix(item).sizes.get(key) ?? 0), 0);
}

export default function OrderProductTable({
  order, bundle, itemMaterials, materialRows, loading, canViewProduction, canEditOrder, onRefreshOrder, productionApprovals = {},
}: Props) {
  const [mode, setMode] = useState<Mode>("style");
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(() => [...new Set(order.items.map(getMarket))]);
  const [editor, setEditor] = useState<OrderSkuEditTarget | null>(null);
  const availableMarkets = [...new Set(order.items.map(getMarket))];
  const activeMarkets = selectedMarkets.filter(code => availableMarkets.includes(code));
  const toggleMarket = (code: string) => setSelectedMarkets(current => current.includes(code) ? current.filter(value => value !== code) : [...current, code]);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const rows = order.items.filter(item => {
    const matchesMarket = activeMarkets.includes(getMarket(item));
    const q = search.trim().toLowerCase();
    return matchesMarket && (!q || [item.skuSnapshot, item.productNameSnapshot, item.colorSnapshot, getMarket(item)]
      .some(value => (value ?? "").toLowerCase().includes(q)));
  });
  const groups = (() => {
    const data = new Map<string, OrderItemRecord[]>();
    rows.forEach((item, index) => {
      const key = mode === "style" ? styleKey(item) : mode === "market" ? getMarket(item) : `row-${index}`;
      data.set(key, [...(data.get(key) ?? []), item]);
    });
    return [...data.entries()];
  })();
  const unallocated = rows.reduce((total, item) => total + (matrix(item).sizes.get("UNALLOCATED") ?? 0), 0);
  const marketCount = availableMarkets.filter(code => code !== "OTHER").length;
  const styleCount = new Set(order.items.map(styleKey)).size;
  const missingImageStyles = [...new Set(order.items.map(styleKey))].filter(key =>
    !order.items.some(item => styleKey(item) === key && Boolean(item.designImageUrl?.trim()))
  ).length;
  const missingImageSkus = order.items.filter(item => !item.designImageUrl?.trim()).length;
  if (loading) return <AdminInlineLoader message="Đang tải bảng sản phẩm và phân bổ size…" />;

  return <section className={styles.sheet} aria-label="Order items and size matrix" data-testid="order-size-matrix">
    {missingImageStyles > 0 && <div className={styles.thumbnailAlert} role="status">Thiếu ảnh thumbnail: <strong>{missingImageStyles}/{styleCount} mẫu</strong> · {missingImageSkus}/{order.items.length} SKU. {canEditOrder ? "Bấm trực tiếp vào ô THÊM ẢNH để chọn ảnh từ thư viện hoặc tải lên. Ảnh cấp mẫu có thể áp dụng cho tất cả thị trường." : "Liên hệ người phụ trách đơn hàng để cập nhật ảnh."}</div>}
    <div className={styles.heading}>
      <div>
        <div className={styles.eyebrow}>ORDER ITEMS / SIZE MATRIX</div>
        <h2>Danh sách sản phẩm</h2>
        <p>{styleCount} mẫu · {order.items.length} dòng SKU · {marketCount || "—"} thị trường</p>
      </div>
      <div className={styles.controls}>
        <label className={styles.srOnly} htmlFor="order-matrix-search">Tìm theo sản phẩm, SKU hoặc thị trường</label>
        <input id="order-matrix-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm tên hàng, SKU…" className={styles.search} />

        <div className={styles.segment} role="group" aria-label="Chế độ nhóm sản phẩm">
          {([["style", "Theo mẫu"], ["market", "Theo thị trường"], ["all", "Tất cả"]] as const).map(([value, label]) =>
            <button type="button" key={value} aria-pressed={mode === value} className={mode === value ? styles.selected : ""} onClick={() => setMode(value)}>{label}</button>)}
        </div>
      </div>
    </div>
    <div className={styles.marketSelector} role="group" aria-label="Chọn thị trường để cộng số lượng">
      <span className={styles.marketSelectorLabel}>TỔNG HỢP THỊ TRƯỜNG</span>
      <button type="button" className={styles.marketAll} onClick={() => setSelectedMarkets([...availableMarkets])}>Chọn tất cả</button>
      {availableMarkets.map(code => <label key={code} className={`${styles.marketCheck} ${activeMarkets.includes(code) ? styles.marketCheckActive : ""}`}><input type="checkbox" checked={activeMarkets.includes(code)} onChange={() => toggleMarket(code)}/><span>{code} · {MARKET_LABELS[code]}</span></label>)}
      <span className={styles.marketHint}>{activeMarkets.length}/{availableMarkets.length} thị trường · số lượng cộng theo style & size</span>
    </div>
    <div className={styles.miniStats}>
      <span><strong>{format(rows.reduce((sum, item) => sum + item.quantity, 0))}</strong> pcs đang hiển thị</span>
      <span><strong>{rows.length}</strong> SKU lines</span>
      <span className={unallocated ? styles.warning : ""}><strong>{format(unallocated)}</strong> pcs chưa phân size (đã chọn)</span>
    </div>
    <div className={styles.scroll} role="region" tabIndex={0} aria-label="Bảng sản phẩm cuộn ngang">
      <table className={styles.table}>
        <thead><tr>
          <th className={styles.stickyNumber}>#</th><th className={styles.stickyName}>PRODUCT / SKU</th><th>MARKET</th>
          {SIZE_KEYS.slice(0, 5).map(key => <th className={styles.numeric} key={key}>{key}</th>)}
          <th className={styles.numeric}>FREE</th><th className={styles.numeric}>UNALLOC.</th><th className={styles.numeric}>TOTAL</th>
          <th>DOCS</th><th>PRODUCTION / QC</th><th>ACTION</th>
        </tr></thead>
        <tbody>{groups.map(([key, items]) => {
          const showGroup = mode !== "all";
          return [
            showGroup && <tr className={styles.groupRow} key={`g-${key}`}>
              <td colSpan={3} className={styles.groupIdentity}>
                <div className={styles.groupHeader}>
                  {mode === "style" && <ProductThumbnail key={getThumbnail(items) ?? "empty"} src={getThumbnail(items)} label={items[0]?.productNameSnapshot || key} onAttach={canEditOrder ? () => setEditor({ item: items[0], level: "style" }) : undefined} />}
                  <div className={styles.groupDescription}>
                    <button type="button" onClick={() => setCollapsed(current => ({ ...current, [key]: !current[key] }))} aria-expanded={!collapsed[key]}>{collapsed[key] ? "▸" : "▾"} {mode === "market" ? MARKET_LABELS[key] || key : mode === "style" ? items[0]?.productNameSnapshot || key : key}</button>
                    <span>{mode === "style" ? `${key} · ` : ""}{items.length} SKU {mode === "style" ? (getThumbnail(items) ? "· đã có ảnh mẫu" : "· chưa có ảnh mẫu") : ""}</span>
                    {mode === "style" && canEditOrder && <button type="button" className={styles.attachImage} onClick={() => setEditor({ item: items[0], level: "style" })}>✎ Chỉnh style / ảnh</button>}
                  </div>
                </div>
              </td>
              {SIZE_KEYS.slice(0, 5).map(size => <td className={styles.numeric} key={size}>{sumSizes(items, size) ? format(sumSizes(items, size)) : "—"}</td>)}
              <td className={styles.numeric}>{sumSizes(items, "FREE") ? format(sumSizes(items, "FREE")) : "—"}</td>
              <td className={styles.numeric}>{sumSizes(items, "UNALLOCATED") ? <strong className={styles.warning}>{format(sumSizes(items, "UNALLOCATED"))}</strong> : "—"}</td>
              <td className={styles.total}>{format(items.reduce((sum, item) => sum + item.quantity, 0))}</td><td colSpan={3} />
            </tr>,
            ...(!collapsed[key] || mode === "all" ? items.map(item => {
              const index = order.items.findIndex(row => row.id === item.id) + 1;
              const current = matrix(item);
              const exec = findExecutionBundleForItem(bundle, item.id);
              const progress = exec ? mapReadinessToProgressBadge(exec.readiness.state) : "PREPARING";
              const docStatus = exec ? deriveDocumentStatus(exec) : "Thiếu";
              const matStatus = deriveMaterialStatus(item.id, itemMaterials, materialRows);
              const qcStatus = exec ? deriveQcStatus(exec.qc) : "Chờ QC";
              const progressPercent = exec ? deriveProgressPercent(exec) : null;
              const approval = productionApprovals[item.id];
              const isApproved = approval?.status === "RELEASED" && !approval.artworkStale;
              return <tr key={item.id}>
                <td className={styles.stickyNumber}>{index}</td>
                <td className={styles.stickyName}><div className={styles.itemIdentity}>
                  <ProductThumbnail key={item.designImageUrl || item.id} src={item.designImageUrl?.trim() || null} label={item.productNameSnapshot || item.skuSnapshot || "SKU"} small onAttach={canEditOrder ? () => setEditor({ item, level: "sku" }) : undefined} />
                  <div className={styles.itemDetails}><strong>{item.productNameSnapshot || "Unnamed item"}</strong><small>{item.skuSnapshot || "SKU pending"}</small></div>
                </div></td>
                <td><span className={styles.market}>{getMarket(item)}</span></td>
                {SIZE_KEYS.slice(0, 5).map(size => <td className={styles.numeric} key={size}>{current.sizes.get(size) ? format(current.sizes.get(size)!) : "—"}</td>)}
                <td className={styles.numeric}>{current.free ? format(current.free) : "—"}</td>
                <td className={styles.numeric}>{current.sizes.get("UNALLOCATED") ? <strong className={styles.warning}>{format(current.sizes.get("UNALLOCATED")!)}</strong> : "—"}</td>
                <td className={styles.total}>{format(item.quantity)}{current.mismatch && <span className={styles.warning} title="Tổng biến thể vượt quá số lượng sản phẩm"> !</span>}</td>
                <td><span className={docStatus === "Đủ" ? styles.ok : styles.warning}>{docStatus}</span></td>
                <td className={styles.status}><strong>{PRODUCT_PROGRESS_LABELS[progress]}</strong>{progressPercent != null && <small>{progressPercent}%</small>}<small>Material: {matStatus} · QC: {qcStatus}</small>{canViewProduction && !isApproved && <small className={styles.warning}>Chưa duyệt SX</small>}</td>
                <td><div className={styles.rowActions}>{canEditOrder && <button type="button" className={styles.action} onClick={() => setEditor({ item, level: "sku" })}>Sửa SKU</button>}{canViewProduction && <Link className={styles.action} href={`/admin/production/jobs/${encodeURIComponent(item.id)}`}>Mở Job</Link>}{!canEditOrder && !canViewProduction && <span className={styles.muted}>—</span>}</div></td>
              </tr>;
            }) : []),
          ];
        })}</tbody>
      </table>
    </div>
    {!rows.length && <div className={styles.empty}>Không tìm thấy sản phẩm phù hợp với bộ lọc.</div>}
    <div className={styles.foot}>Các ô tổng chỉ cộng những thị trường được tick, không chỉnh sửa số lượng lưu trong đơn. Cột FREE dành cho hàng không chia size; UNALLOCATED là số lượng chưa phân bổ. Kéo ngang bảng để xem toàn bộ công đoạn.</div>
    {editor && <OrderSkuEditor key={`${editor.item.id}-${editor.level}`} orderId={order.id} target={editor} onClose={() => setEditor(null)} onSaved={async () => { if (onRefreshOrder) await onRefreshOrder(); }} />}
  </section>;
}
