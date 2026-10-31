"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

type Point = { x: number; y: number };
type Line = { id: string; measurementId: string; points: Point[] };
type Annotation = { imageFileId: string | null; lines: Line[] };
type PatternImage = { id: string; type: string; mimeType?: string | null; title?: string | null; originalFileName?: string | null };
type Measurement = { id: string; pointOfMeasure: string; description?: string | null };

function pointFromEvent(event: PointerEvent<SVGSVGElement>): Point {
  const bounds = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
    y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
  };
}
const initial: Annotation = { imageFileId: null, lines: [] };

export default function PatternMeasurementAnnotationEditor({
  patternId, files, measurements, readOnly,
}: { patternId: string; files: PatternImage[]; measurements: Measurement[]; readOnly: boolean }) {
  const [annotations, setAnnotations] = useState<Annotation>(initial);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState("");
  const [firstPoint, setFirstPoint] = useState<Point | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "draw">("view");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const dragging = useRef<{ lineId: string; pointIndex: number } | null>(null);
  const images = files.filter((f) => f.type === "IMAGE" || f.mimeType?.startsWith("image/"));
  const endpoint = "/api/patterns/" + encodeURIComponent(patternId) + "/measurement-annotations";

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Không thể tải đường đo.");
      const data = json.annotations as Annotation;
      setAnnotations({
        imageFileId: data?.imageFileId ?? null,
        lines: Array.isArray(data?.lines) ? data.lines : [],
      });
      setDirty(false);
      setMessage("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Lỗi tải đường đo.");
    } finally {
      setBusy(false);
    }
  }, [endpoint]);

  useEffect(() => { void load(); }, [load]);

  const onCanvasClick = (event: PointerEvent<SVGSVGElement>) => {
    if (readOnly || mode !== "draw" || dragging.current || !selectedMeasurementId || !annotations.imageFileId) return;
    const point = pointFromEvent(event);
    if (!firstPoint) { setFirstPoint(point); return; }
    const line: Line = {
      id: "line_" + Math.random().toString(36).slice(2, 12),
      measurementId: selectedMeasurementId,
      points: [firstPoint, point],
    };
    setAnnotations((current) => ({ ...current, lines: [...current.lines, line] }));
    setSelectedLineId(line.id);
    setFirstPoint(null);
    setDirty(true);
  };

  const movePoint = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragging.current || readOnly) return;
    const { lineId, pointIndex } = dragging.current;
    const point = pointFromEvent(event);
    setAnnotations((current) => ({
      ...current, lines: current.lines.map((line) => line.id !== lineId ? line : {
        ...line, points: line.points.map((p, index) => index === pointIndex ? point : p),
      }),
    }));
    setDirty(true);
  };

  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(annotations),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể lưu đường đo.");
      setDirty(false);
      setMessage("Đã lưu đường đo.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Không thể lưu đường đo.");
    } finally {
      setBusy(false);
    }
  }

  const imageUrl = annotations.imageFileId
    ? "/api/patterns/" + encodeURIComponent(patternId) + "/files/" + encodeURIComponent(annotations.imageFileId) + "/open"
    : null;
  const selected = annotations.lines.find((line) => line.id === selectedLineId);

  return (
    <section className="admin-panel" style={{ padding: 18, marginTop: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Sơ đồ đường đo (POM)</h2>
          <p className="admin-muted">Minh họa vị trí đo trên ảnh kỹ thuật. Không tự tính kích thước từ ảnh.</p>
        </div>
        {!readOnly && <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="admin-btn admin-btn--xs" disabled={busy || !dirty} onClick={() => void load()}>Hoàn tác thay đổi</button>
          <button type="button" className="admin-btn admin-btn--primary admin-btn--xs" disabled={busy || !dirty} onClick={() => void save()}>{busy ? "Đang lưu..." : "Lưu đường đo"}</button>
        </div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Ảnh kỹ thuật</span>
          <select className="admin-select" aria-label="Ảnh dùng để vẽ đường đo" disabled={readOnly || busy} value={annotations.imageFileId ?? ""}
            onChange={(e) => {
              if (annotations.lines.length && !window.confirm("Đổi ảnh sẽ xóa các đường đo hiện tại. Tiếp tục?")) return;
              setAnnotations({ imageFileId: e.target.value || null, lines: [] });
              setDirty(true); setFirstPoint(null); setSelectedLineId(null);
            }}>
            <option value="">Chọn ảnh rập...</option>
            {images.map((file) => <option key={file.id} value={file.id}>{file.originalFileName || file.title || file.id}</option>)}
          </select>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Điểm đo</span>
          <select className="admin-select" aria-label="Chọn điểm đo POM" value={selectedMeasurementId}
            onChange={(e) => { setSelectedMeasurementId(e.target.value); setFirstPoint(null); }}>
            <option value="">Chọn POM...</option>
            {measurements.map((m) => <option key={m.id} value={m.id}>{m.pointOfMeasure}{m.description ? " — " + m.description : ""}</option>)}
          </select>
        </label>
        {!readOnly && <>
          <button type="button" className="admin-btn admin-btn--xs" aria-pressed={mode === "draw"}
            onClick={() => { setMode(mode === "draw" ? "view" : "draw"); setFirstPoint(null); }}>
            {mode === "draw" ? "Đang vẽ: bấm 2 điểm" : "Vẽ đường"}
          </button>
          <button type="button" className="admin-btn admin-btn--xs" disabled={!selected || busy}
            onClick={() => {
              setAnnotations((current) => ({ ...current, lines: current.lines.filter((line) => line.id !== selectedLineId) }));
              setSelectedLineId(null); setDirty(true);
            }}>Xóa đường đã chọn</button>
        </>}
      </div>
      {message && <p role="status" style={{ marginBottom: 10 }}>{message}</p>}
      {dirty && <p className="admin-field-hint" role="status">Có thay đổi chưa lưu.</p>}
      {imageUrl ? (
        <div style={{ maxWidth: 780, position: "relative", border: "1px solid #dbe3ed", borderRadius: 8, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Ảnh kỹ thuật phục vụ chú thích đường đo" style={{ display: "block", width: "100%", height: "auto" }} />
          <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-label="Các đường đo trên ảnh"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: !readOnly && mode === "draw" ? "crosshair" : "default", touchAction: "none" }}
            onPointerDown={(event) => {
              if (event.target !== event.currentTarget || dragging.current) return;
              if (mode === "draw") onCanvasClick(event);
              else setSelectedLineId(null);
            }}
            onPointerMove={movePoint}
            onPointerUp={() => { dragging.current = null; }}
            onPointerCancel={() => { dragging.current = null; }}>
            {annotations.lines.map((line) => {
              const active = line.id === selectedLineId || line.measurementId === selectedMeasurementId;
              return <g key={line.id}>
                <polyline points={line.points.map((p) => (p.x * 1000) + "," + (p.y * 1000)).join(" ")}
                  fill="none" stroke={active ? "#e23e34" : "#2874c9"} strokeWidth={active ? 5 : 3}
                  vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"
                  onPointerDown={(event) => { event.stopPropagation(); setSelectedLineId(line.id); }} />
                {line.points.map((point, i) => (
                  <circle key={i} cx={point.x * 1000} cy={point.y * 1000} r={9}
                    vectorEffect="non-scaling-stroke" stroke="#fff" strokeWidth={3}
                    fill={active ? "#e23e34" : "#2874c9"}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      setSelectedLineId(line.id);
                      if (!readOnly && mode !== "draw") { dragging.current = { lineId: line.id, pointIndex: i }; event.currentTarget.setPointerCapture(event.pointerId); }
                    }}
                    onPointerUp={() => { dragging.current = null; }}
                  />
                ))}
              </g>;
            })}
            {firstPoint && <circle cx={firstPoint.x * 1000} cy={firstPoint.y * 1000} r={8} fill="#e23e34" />}
          </svg>
        </div>
      ) : <p className="admin-muted">{images.length ? "Chọn ảnh để xem hoặc tạo đường đo." : "Chưa có ảnh kỹ thuật. Hãy tải file JPG/PNG/WebP vào mục File rập trước."}</p>}
      {annotations.lines.length > 0 && <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {annotations.lines.map((line) => {
          const m = measurements.find((item) => item.id === line.measurementId);
          return <button key={line.id} type="button" className="admin-btn admin-btn--xs"
            aria-pressed={selectedLineId === line.id} onClick={() => { setSelectedLineId(line.id); setMode("view"); }}>
            {m?.pointOfMeasure || "POM không tồn tại"}
          </button>;
        })}
      </div>}
      <p className="admin-field-hint" style={{ marginTop: 12 }}>
        {!readOnly ? "Cách dùng: Chọn ảnh và POM → bấm Vẽ đường → chấm điểm đầu và điểm cuối → Lưu. Chọn đường rồi kéo đầu mút để sửa." : "Rập đã duyệt: chỉ xem sơ đồ. Chuyển về Bản nháp hoặc tạo phiên bản mới để sửa."}
      </p>
    </section>
  );
}
