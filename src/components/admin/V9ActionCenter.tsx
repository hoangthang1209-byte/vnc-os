"use client";

import Link from "next/link";
import { ClipboardList, RefreshCcw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Task = { id: string; title: string; leadName: string; dueAt: string | null; status: "overdue" | "today" | "upcoming" | "unscheduled" };
type Payload = { source: string; tasks: Task[]; counts: Record<Task["status"], number>; hasMore: boolean };

const LABELS: Record<Task["status"], string> = {
  overdue: "Quá hạn", today: "Hôm nay", upcoming: "Sắp tới", unscheduled: "Chưa có hạn",
};

export default function V9ActionCenter() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/v9/action-center", { cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 403 ? "Bạn không có quyền xem công việc CRM." : response.status === 401 ? "Phiên đăng nhập đã hết hạn." : "Không thể tải công việc.");
      setData(await response.json() as Payload);
    } catch (err) { setError(err instanceof Error ? err.message : "Không thể tải công việc."); setData(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (open && !data && !loading && !error) void load(); }, [open, data, loading, error, load]);

  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="v9-action-center-panel"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px", border: "1px solid #dbe2eb", borderRadius: 8, background: "#fff", color: "#202d3d", fontWeight: 650, fontSize: 12, cursor: "pointer" }}>
        <ClipboardList size={15} aria-hidden="true" /> Công việc
      </button>
      {open ? (
        <section id="v9-action-center-panel" aria-label="Công việc CRM thực tế"
          style={{ position: "absolute", zIndex: 60, right: 0, top: 42, width: "min(370px, 85vw)", maxHeight: "min(560px, 75vh)", overflow: "auto", background: "#fff", border: "1px solid #e1e7ee", borderRadius: 12, boxShadow: "0 16px 40px #14223624", padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <div><strong style={{ color: "#142236", fontSize: 15 }}>Action Center</strong><p style={{ color: "#748397", margin: "3px 0 0", fontSize: 11 }}>Công việc Lead CRM đã phân quyền</p></div>
            <div style={{ display: "flex", gap: 7 }}>
              <button type="button" aria-label="Tải lại công việc" onClick={() => void load()} style={{ border: 0, background: "transparent", cursor: "pointer" }}><RefreshCcw size={15}/></button>
              <button type="button" aria-label="Đóng Action Center" onClick={() => setOpen(false)} style={{ border: 0, background: "transparent", cursor: "pointer" }}><X size={16}/></button>
            </div>
          </div>
          {loading && <p role="status">Đang tải công việc...</p>}
          {error && <p role="alert" style={{ color: "#b42318", fontSize: 12 }}>{error}</p>}
          {data && !loading && <>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <span style={{ padding: "7px 10px", background: "#fff1f0", borderRadius: 7, color: "#b42318", fontSize: 12 }}>Quá hạn <b>{data.counts.overdue}</b></span>
              <span style={{ padding: "7px 10px", background: "#f5f7fa", borderRadius: 7, fontSize: 12 }}>Hôm nay <b>{data.counts.today}</b></span>
              <span style={{ padding: "7px 10px", background: "#f5f7fa", borderRadius: 7, fontSize: 12 }}>Sắp tới <b>{data.counts.upcoming}</b></span>
            </div>
            {data.tasks.length === 0 ? <p style={{ color: "#748397", fontSize: 12 }}>Không có công việc CRM đang mở trong phạm vi được giao.</p> :
              <div style={{ display: "grid", gap: 7 }}>
                {data.tasks.map((task) => <div key={task.id} style={{ border: "1px solid #e1e7ee", borderRadius: 8, padding: 10 }}>
                  <strong style={{ fontSize: 12, color: "#202d3d" }}>{task.title}</strong>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 5, fontSize: 11, color: "#748397" }}>
                    <span>{task.leadName}</span><span>{LABELS[task.status]}</span>
                  </div>
                </div>)}
              </div>}
            {data.hasMore && <p style={{ fontSize: 11, color: "#748397" }}>Đang hiển thị 100 công việc đầu tiên; bộ đếm áp dụng cho danh sách này.</p>}
            <Link href="/admin/crm/leads" onClick={() => setOpen(false)} style={{ display: "inline-block", marginTop: 12, color: "#b21f2c", fontSize: 12, fontWeight: 700 }}>Mở quản lý Lead →</Link>
          </>}
        </section>
      ) : null}
    </div>
  );
}
