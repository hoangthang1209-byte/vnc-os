"use client";

import { useState } from "react";
import MediaPicker from "@/components/admin/media/MediaPicker";
import type { OrderItemRecord } from "@/features/orders/order.types";
import styles from "./OrderSkuEditor.module.css";

export type OrderSkuEditTarget = { item: OrderItemRecord; level: "style" | "sku" };
type Props = {
  orderId: string;
  target: OrderSkuEditTarget;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};
type Draft = { productNameSnapshot: string; description: string; itemNote: string; colorSnapshot: string; designImageUrl: string };
const makeDraft = (item: OrderItemRecord): Draft => ({
  productNameSnapshot: item.productNameSnapshot ?? "",
  description: item.description ?? "",
  itemNote: item.itemNote ?? "",
  colorSnapshot: item.colorSnapshot ?? "",
  designImageUrl: item.designImageUrl ?? "",
});

export default function OrderSkuEditor({ orderId, target, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Draft>(() => makeDraft(target.item));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { item, level } = target;
  const isStyle = level === "style";

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isStyle ? { productNameSnapshot: form.productNameSnapshot, designImageUrl: form.designImageUrl, applyToStyle: true } : { ...form, applyToStyle: false }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Không thể lưu SKU");
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu SKU");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-label={isStyle ? "Chỉnh sửa style" : "Chỉnh sửa SKU"}>
        <header className={styles.header}>
          <div><small>{isStyle ? "STYLE EDITOR · ALL MARKETS" : "SKU EDITOR · SINGLE MARKET"}</small><h2>{isStyle ? "Chỉnh sửa style" : "Chỉnh sửa SKU"}</h2><p>{item.skuSnapshot ?? "SKU chưa có mã"}</p></div>
          <button type="button" className={styles.close} onClick={onClose} disabled={busy} aria-label="Đóng">×</button>
        </header>
        <div className={styles.body}>
          {isStyle && <div className={styles.notice}>Tên và ảnh style sẽ áp dụng cho mọi thị trường. Ghi chú, quy cách, màu riêng từng SKU được giữ nguyên để tránh ghi đè deadline và thông tin kỹ thuật của từng city.</div>}
          <label className={styles.field}>Tên sản phẩm / Style
            <input value={form.productNameSnapshot} onChange={event => setForm({ ...form, productNameSnapshot: event.target.value })} maxLength={450}/>
          </label>
          {!isStyle && <label className={styles.field}>Màu sắc / Color
            <input value={form.colorSnapshot} onChange={event => setForm({ ...form, colorSnapshot: event.target.value })} maxLength={450}/>
          </label>}
          <div className={styles.media}>
            <strong>Ảnh thumbnail sản phẩm</strong>
            <p>Chọn từ thư viện ảnh VNC hoặc tải hình mới lên. Có thể dùng ảnh riêng cho từng city.</p>
            <MediaPicker folder="products" usageType="auto" value={form.designImageUrl} onChange={url => setForm(current => ({ ...current, designImageUrl: url }))}/>
            <label className={styles.field}>URL ảnh (tùy chọn)
              <input value={form.designImageUrl} onChange={event => setForm({ ...form, designImageUrl: event.target.value })} placeholder="https://…"/>
            </label>
          </div>
          {!isStyle && <label className={styles.field}>Mô tả / Specification
            <textarea rows={3} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} maxLength={4000}/>
          </label>}
          {!isStyle && <label className={styles.field}>Ghi chú kỹ thuật
            <textarea rows={3} value={form.itemNote} onChange={event => setForm({ ...form, itemNote: event.target.value })} maxLength={4000}/>
          </label>}
          <div className={styles.notice}>Số lượng, phân size và mã SKU được giữ nguyên để bảo toàn Production Job, BOM và QC. Các nghiệp vụ thay đổi số lượng dùng chức năng riêng.</div>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </div>
        <footer className={styles.footer}>
          <button type="button" className={styles.cancel} onClick={onClose} disabled={busy}>Hủy</button>
          <button type="button" className={styles.save} onClick={() => void save()} disabled={busy || !form.productNameSnapshot.trim()}>{busy ? "Đang lưu…" : "Lưu thay đổi"}</button>
        </footer>
      </section>
    </div>
  );
}
