"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Batch = { id: string; code: string; name: string; _count: { orders: number } };
type Project = { id: string; code: string; name: string; customer: { name: string; code: string }; batches: Batch[] };

export default function OrderProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [batchName, setBatchName] = useState("");
  const [saving, setSaving] = useState(false);
  const refresh = async () => {
    const r = await fetch("/api/orders/projects", { cache: "no-store" });
    const v = await r.json();
    if (!r.ok) throw new Error(v.message ?? "Không tải được dự án");
    setProjects(v.projects);
  };
  useEffect(() => { void refresh().catch(e => setError(e.message)); }, []);
  const submit = async (path: string, body: object) => {
    setSaving(true); setError("");
    try {
      const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const v = await r.json();
      if (!r.ok) throw new Error(v.message ?? "Không thể lưu");
      await refresh();
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi không xác định"); return false; }
    finally { setSaving(false); }
  };
  return <main className="admin-content" style={{ padding: 20 }}>
    <p><Link href="/admin/orders">Đơn hàng</Link> / Dự án & Batch</p>
    <h1>Dự án & đợt đơn hàng</h1>
    <p className="admin-field-hint">Dự án tập hợp các Batch của cùng một khách hàng. PO và Shipment là các đối tượng riêng, không gộp vào Batch.</p>
    {error && <p role="alert" style={{ color: "var(--color-error, #b42318)" }}>{error}</p>}
    <form onSubmit={async e => { e.preventDefault(); if (await submit("/api/orders/projects", { customerId, code, name })) { setCode(""); setName(""); } }} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "end" }}>
      <label>Mã ID khách hàng<input className="admin-input" required value={customerId} onChange={e => setCustomerId(e.target.value)} /></label>
      <label>Mã dự án<input className="admin-input" required value={code} onChange={e => setCode(e.target.value)} placeholder="BIGBANG" /></label>
      <label>Tên dự án<input className="admin-input" required value={name} onChange={e => setName(e.target.value)} placeholder="Bigbang Merchandise" /></label>
      <button className="admin-btn admin-btn--primary" disabled={saving}>Tạo Project</button>
    </form>
    <section style={{ marginTop: 24 }}>
      {projects.map(p => <article key={p.id} className="admin-card" style={{ padding: 16, marginBottom: 12 }}>
        <h2>{p.code} — {p.name}</h2>
        <p className="admin-field-hint">{p.customer.code} · {p.customer.name}</p>
        <ul>{p.batches.map(b => <li key={b.id}>{b.code} — {b.name} · {b._count.orders} đơn</li>)}</ul>
        <button className="admin-btn admin-btn--secondary" type="button" onClick={() => setSelectedProject(p.id)}>Thêm Batch</button>
        {selectedProject === p.id && <form style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }} onSubmit={async e => { e.preventDefault(); if (await submit(`/api/orders/projects/${p.id}/batches`, { code: batchCode, name: batchName })) { setSelectedProject(""); setBatchCode(""); setBatchName(""); } }}>
          <label>Mã Batch<input className="admin-input" required value={batchCode} onChange={e => setBatchCode(e.target.value)} placeholder="BATCH-2" /></label>
          <label>Tên Batch<input className="admin-input" required value={batchName} onChange={e => setBatchName(e.target.value)} /></label>
          <button className="admin-btn admin-btn--primary" disabled={saving}>Lưu Batch</button>
        </form>}
      </article>)}
      {projects.length === 0 && <p>Chưa có Project nào. Chỉ tạo dự án khi đã xác nhận đúng Customer.</p>}
    </section>
  </main>;
}
