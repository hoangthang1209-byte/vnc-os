"use client";
import { useEffect, useState } from "react";

type Supplier = { id: string; code: string; name: string };
type Rfq = { id: string; title: string; status: string; supplier: { name: string }; quotedPrice: string | number | null; moq: number | null; leadTimeDays: number | null };
type Score = { id: string; period: string; supplier: { name: string }; weightedScore: number; qualityScore: number; deliveryScore: number; priceScore: number; responsivenessScore: number };
export default function SupplierSrmPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState(new Date().toISOString().slice(0,7));
  const [quality, setQuality] = useState("80");
  const [delivery, setDelivery] = useState("80");
  const [price, setPrice] = useState("80");
  const [response, setResponse] = useState("80");
  const [message, setMessage] = useState("");
  async function refresh() {
    const [s,r,c] = await Promise.all([fetch("/api/production-suppliers?pageSize=1000"),fetch("/api/supplier-rfqs"),fetch("/api/supplier-scorecards")]);
    if (s.ok) { const v = await s.json(); setSuppliers(v.items ?? []); }
    if (r.ok) { const v = await r.json(); setRfqs(v.items ?? []); }
    if (c.ok) { const v = await c.json(); setScores(v.items ?? []); }
  }
  useEffect(() => { void refresh(); }, []);
  async function submit(url: string, data: Record<string, unknown>) {
    setMessage("");
    const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    const body=await r.json();
    setMessage(r.ok?"Đã lưu thành công.":body.message??"Không thể lưu.");
    if (r.ok) await refresh();
  }
  return <main className="mx-auto max-w-6xl space-y-8 p-6">
    <h1 className="text-2xl font-semibold">Supplier SRM · RFQ & Scorecard</h1>
    <p className="text-sm text-gray-500">Quản lý báo giá và đánh giá NCC. Thông tin thẩm định thực tế cần được xác nhận riêng trước khi phê duyệt.</p>
    <label className="block text-sm">Nhà cung cấp
      <select className="mt-1 w-full rounded border p-2" value={supplierId} onChange={e=>setSupplierId(e.target.value)}>
        <option value="">Chọn nhà cung cấp</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
      </select>
    </label>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Yêu cầu báo giá (RFQ)</h2>
      <input className="w-full rounded border p-2" placeholder="Tên sản phẩm / yêu cầu báo giá" value={title} onChange={e=>setTitle(e.target.value)}/>
      <button className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" disabled={!supplierId||!title.trim()} onClick={()=>void submit("/api/supplier-rfqs",{supplierId,title})}>Tạo RFQ</button>
      <div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">NCC</th><th className="p-2">RFQ</th><th className="p-2">Trạng thái</th><th className="p-2">Báo giá</th><th className="p-2">MOQ</th><th className="p-2">Lead time (ngày)</th></tr></thead><tbody>{rfqs.map(r=><tr key={r.id} className="border-t"><td className="p-2">{r.supplier.name}</td><td className="p-2">{r.title}</td><td className="p-2">{r.status}</td><td className="p-2">{r.quotedPrice??"—"}</td><td className="p-2">{r.moq??"—"}</td><td className="p-2">{r.leadTimeDays??"—"}</td></tr>)}</tbody></table></div>
    </section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Supplier Scorecard</h2>
      <div className="grid gap-2 sm:grid-cols-5"><label>Kỳ (YYYY-MM)<input className="w-full rounded border p-2" type="month" value={period} onChange={e=>setPeriod(e.target.value)}/></label>{([["Chất lượng",quality,setQuality],["Giao hàng",delivery,setDelivery],["Giá",price,setPrice],["Phản hồi",response,setResponse]] as const).map(([label,value,set])=><label key={label}>{label}<input type="number" min={0} max={100} className="w-full rounded border p-2" value={value} onChange={e=>set(e.target.value)}/></label>)}</div>
      <button className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" disabled={!supplierId} onClick={()=>void submit("/api/supplier-scorecards",{supplierId,period,qualityScore:Number(quality),deliveryScore:Number(delivery),priceScore:Number(price),responsivenessScore:Number(response)})}>Lưu điểm đánh giá</button>
      <div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">NCC</th><th className="p-2">Kỳ</th><th className="p-2">Tổng điểm</th><th className="p-2">Chất lượng</th><th className="p-2">Giao hàng</th><th className="p-2">Giá</th><th className="p-2">Phản hồi</th></tr></thead><tbody>{scores.map(s=><tr key={s.id} className="border-t"><td className="p-2">{s.supplier.name}</td><td className="p-2">{s.period}</td><td className="p-2 font-semibold">{s.weightedScore.toFixed(1)}</td><td className="p-2">{s.qualityScore}</td><td className="p-2">{s.deliveryScore}</td><td className="p-2">{s.priceScore}</td><td className="p-2">{s.responsivenessScore}</td></tr>)}</tbody></table></div>
    </section>
    {message?<p role="status" className="rounded border p-3">{message}</p>:null}
  </main>;
}
