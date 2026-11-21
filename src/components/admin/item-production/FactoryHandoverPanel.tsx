"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLoadingButton from "@/components/admin/feedback/AdminLoadingButton";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import type { FactoryHandoverType, FactoryHandoverTotals } from "@/features/item-production-tracking/factory-handover-balance";

type HandoverRow = {
  id: string; type: FactoryHandoverType; quantity: number; reference: string | null;
  note: string | null; createdAt: string; createdByAdminUserId: string | null;
};
type Payload = {
  batch: { code: string; status: string; plannedQuantity: number; supplier: { name: string } | null; handoverEvents: HandoverRow[] };
  totals: FactoryHandoverTotals;
};
const actions: Array<{ value: FactoryHandoverType; label: string }> = [
  { value: "VNC_DISPATCH", label: "VNC xuất giao cho xưởng" },
  { value: "FACTORY_RECEIVE", label: "Xưởng xác nhận nhận" },
  { value: "FACTORY_RETURN", label: "Xưởng trả hàng về VNC" },
  { value: "VNC_RECEIVE", label: "VNC xác nhận nhận lại" },
];

export default function FactoryHandoverPanel({ batchId, onClose }: { batchId: string; onClose: () => void }) {
  const toast = useAdminToast();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState<FactoryHandoverType>("VNC_DISPATCH");
  const [quantity, setQuantity] = useState(0);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const load = useCallback(async () => {
    const res = await fetch(`/api/manufacturing/production-batches/${batchId}/handover`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.message ?? "Không tải được giao nhận");
    setData(body as Payload);
  }, [batchId]);

  useEffect(() => {
    let active = true;
    void load().catch(e => { if (active) setError(e instanceof Error ? e.message : "Lỗi tải giao nhận"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  const totals = data?.totals;
  const remaining: Record<FactoryHandoverType, number> = totals && data ? {
    VNC_DISPATCH: data.batch.plannedQuantity - totals.dispatched,
    FACTORY_RECEIVE: totals.awaitingFactory,
    FACTORY_RETURN: totals.withFactory,
    VNC_RECEIVE: totals.returning,
  } : { VNC_DISPATCH: 0, FACTORY_RECEIVE: 0, FACTORY_RETURN: 0, VNC_RECEIVE: 0 };
  const canRecord = Boolean(data && data.batch.status === "ACTIVE" && Number.isSafeInteger(quantity) && quantity > 0 && quantity <= remaining[type] && !pending);
  async function submit() {
    if (!canRecord) return;
    setPending(true); setError("");
    try {
      const res = await fetch(`/api/manufacturing/production-batches/${batchId}/handover`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, quantity, reference: reference.trim(), note: note.trim() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Ghi giao nhận thất bại");
      await load();
      setQuantity(0); setReference(""); setNote("");
      toast.success("Đã ghi nhận giao nhận");
    } catch (e) { setError(e instanceof Error ? e.message : "Ghi giao nhận thất bại"); }
    finally { setPending(false); }
  }

  return <div className="prod-plan-drawer-overlay" role="presentation" onClick={onClose} style={{ zIndex: 65 }}>
    <aside className="prod-plan-drawer" role="dialog" aria-label="Bàn giao VNC và xưởng" onClick={e => e.stopPropagation()}>
      <div className="admin-section-header"><h2 className="admin-subtitle">Giao nhận VNC ↔ Factory</h2>
        <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose}>Đóng</button></div>
      {loading && <p>Đang tải lịch sử giao nhận…</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
      {data && <div style={{ display: "grid", gap: 12 }}>
        <p className="admin-field-hint">Lô {data.batch.code} · {data.batch.supplier?.name ?? "Chưa phân xưởng"} · Kế hoạch {data.batch.plannedQuantity.toLocaleString("vi-VN")} pcs</p>
        <div className="admin-section-card" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
          {[
            ["VNC đã giao", totals?.dispatched],
            ["Xưởng đã nhận", totals?.factoryReceived],
            ["Xưởng đã trả", totals?.factoryReturned],
            ["VNC đã nhận lại", totals?.vncReceived],
            ["Đang chờ xưởng xác nhận", totals?.awaitingFactory],
            ["Còn tại xưởng", totals?.withFactory],
            ["Đang chờ VNC nhận", totals?.returning],
          ].map(([label,value])=><div key={String(label)}><div className="admin-field-hint">{label}</div><strong>{Number(value ?? 0).toLocaleString("vi-VN")}</strong></div>)}
        </div>
        <section className="admin-section-card" style={{ display: "grid", gap: 9 }}>
          <h3 className="admin-subtitle">Ghi sự kiện bàn giao</h3>
          <label className="admin-label">Loại sự kiện
            <select className="admin-input" value={type} onChange={e => { setType(e.target.value as FactoryHandoverType); setQuantity(0); }}>
              {actions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </label>
          <p className="admin-field-hint">Số lượng tối đa có thể ghi tại bước này: {remaining[type].toLocaleString("vi-VN")}</p>
          <label className="admin-label">Số lượng (pcs)
            <input className="admin-input" type="number" min={1} max={remaining[type]} step={1} value={quantity} onChange={e=>setQuantity(Number(e.target.value))} />
          </label>
          <label className="admin-label">Mã phiếu / chứng từ bàn giao
            <input className="admin-input" maxLength={100} value={reference} onChange={e=>setReference(e.target.value)} placeholder="Ví dụ: BG-2026-001" />
          </label>
          <label className="admin-label">Ghi chú
            <textarea className="admin-input" rows={2} maxLength={2000} value={note} onChange={e=>setNote(e.target.value)} />
          </label>
          <AdminLoadingButton pending={pending} disabled={!canRecord} variant="primary" onClick={()=>void submit()}>Lưu sự kiện giao nhận</AdminLoadingButton>
          <p className="admin-field-hint">Nhật ký này là xác nhận số lượng bàn giao vật lý, không tự đánh dấu sản lượng hoàn thành hoặc QC đạt.</p>
        </section>
        <section className="admin-section-card">
          <h3 className="admin-subtitle">Lịch sử giao nhận ({data.batch.handoverEvents.length})</h3>
          {data.batch.handoverEvents.length === 0 && <p className="admin-field-hint">Chưa có sự kiện giao nhận thực tế.</p>}
          {data.batch.handoverEvents.map(event => <div key={event.id} style={{ padding: "9px 0", borderBottom: "1px solid #e5e7eb" }}>
            <strong>{actions.find(a=>a.value===event.type)?.label ?? event.type} · {event.quantity.toLocaleString("vi-VN")} pcs</strong>
            <div className="admin-field-hint">{new Date(event.createdAt).toLocaleString("vi-VN")} · {event.reference || "Không có số chứng từ"}</div>
            {event.note && <div className="admin-field-hint">{event.note}</div>}
          </div>)}
        </section>
      </div>}
    </aside>
  </div>;
}
