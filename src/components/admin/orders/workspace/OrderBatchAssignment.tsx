"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Batch = { id: string; code: string; name: string };
type Project = { id: string; code: string; name: string; batches: Batch[] };
type Props = { orderId: string; customerId: string | null; canEditOrder: boolean };

export default function OrderBatchAssignment({ orderId, customerId, canEditOrder }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [batchId, setBatchId] = useState("");
  const [po, setPo] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (!customerId || !canEditOrder) return;
    void Promise.resolve().then(async () => {
      const [projectsResponse, orderResponse] = await Promise.all([
        fetch(`/api/orders/projects?customerId=${encodeURIComponent(customerId)}`),
        fetch(`/api/orders/${encodeURIComponent(orderId)}/batch`),
      ]);
      if (projectsResponse.status === 403) { setAvailable(false); return; }
      if (!projectsResponse.ok || !orderResponse.ok) { setFeedback("Chưa tải được Project/Batch"); return; }
      const projectsPayload = await projectsResponse.json();
      const orderPayload = await orderResponse.json();
      setProjects(projectsPayload.projects ?? []);
      setBatchId(orderPayload.order?.batchId ?? "");
      setPo(orderPayload.order?.customerPoNo ?? "");
    }).catch(() => setFeedback("Chưa tải được Project/Batch"));
  }, [customerId, canEditOrder, orderId]);

  if (!canEditOrder || !customerId || !available) return null;
  return <section className="admin-card" style={{ padding: 16, marginBottom: 16 }}>
    <h3 style={{ marginTop: 0 }}>Project / Batch / PO của khách</h3>
    <p className="admin-field-hint">Gắn đơn hàng vào đúng đợt dự án; mã PO là tham chiếu riêng, không phải mã Batch.</p>
    <form onSubmit={async event => {
      event.preventDefault(); setSaving(true); setFeedback("");
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/batch`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ batchId: batchId || null, customerPoNo: po }) });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message ?? "Không lưu được");
        setFeedback("Đã cập nhật Project/Batch cho đơn hàng");
      } catch (error) { setFeedback(error instanceof Error ? error.message : "Không lưu được"); }
      finally { setSaving(false); }
    }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
        <label>Batch
          <select className="admin-input" value={batchId} onChange={event => setBatchId(event.target.value)}>
            <option value="">Chưa gắn Batch</option>
            {projects.map(project => <optgroup key={project.id} label={`${project.code} — ${project.name}`}>
              {project.batches.map(batch => <option key={batch.id} value={batch.id}>{batch.code} — {batch.name}</option>)}
            </optgroup>)}
          </select>
        </label>
        <label>PO khách hàng<input className="admin-input" value={po} maxLength={120} onChange={event => setPo(event.target.value)} placeholder="PO reference" /></label>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
        <Link href="/admin/orders/projects">Quản lý Project</Link>
      </div>
    </form>
    {feedback && <p role="status">{feedback}</p>}
  </section>;
}
