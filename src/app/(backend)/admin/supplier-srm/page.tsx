"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Supplier = { id: string; code: string; name: string; category?: string; phone?: string | null; isActive?: boolean; verificationStatus?: string; supplierType?: string; capabilities?: string | null; factoryAddress?: string | null };
type Rfq = { id: string; title: string; status: string; supplier: { name: string }; quotedPrice: string | number | null; moq: number | null; leadTimeDays: number | null };
type Score = { id: string; period: string; supplier: { name: string }; weightedScore: number; qualityScore: number; deliveryScore: number; priceScore: number; responsivenessScore: number };
export default function SupplierSrmPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierLoading,setSupplierLoading] = useState(true);
  const [supplierError,setSupplierError] = useState("");
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
  const [entryName,setEntryName] = useState("");
  const [entryPhone,setEntryPhone] = useState("");
  const [entryEmail,setEntryEmail] = useState("");
  const [entryWebsite,setEntryWebsite] = useState("");
  const [entrySource,setEntrySource] = useState("");
  const [entryContact,setEntryContact] = useState("");
  const [entryNotes,setEntryNotes] = useState("");
  const [entryAddress,setEntryAddress] = useState("");
  const [entryCapabilities,setEntryCapabilities] = useState("");
  const [entryType,setEntryType] = useState("UNKNOWN");
  const [entrySearch,setEntrySearch] = useState("");
  const [entrySaving,setEntrySaving] = useState(false);
  const [quoteId,setQuoteId] = useState("");
  const [quotePrice,setQuotePrice] = useState("");
  const [quoteMoq,setQuoteMoq] = useState("");
  const [quoteLead,setQuoteLead] = useState("");
  const [quoteStatus,setQuoteStatus] = useState("QUOTED");
  async function refresh() {
    setSupplierLoading(true);
    setSupplierError("");
    try {
      const s = await fetch("/api/production-suppliers?pageSize=1000", { cache: "no-store" });
      const data = await s.json().catch(() => ({}));
      if (!s.ok) {
        const reason = typeof data.message === "string" ? data.message : "Không tải được danh sách NCC.";
        throw new Error(`${reason} (HTTP ${s.status}). Vui lòng kiểm tra quyền truy cập hoặc đăng nhập lại.`);
      }
      if (!Array.isArray(data.items)) throw new Error("API trả về dữ liệu NCC không hợp lệ.");
      setSuppliers(data.items);
    } catch (error) {
      setSupplierError(error instanceof Error ? error.message : "Không thể kết nối API nhà cung cấp.");
      setSuppliers([]);
    } finally { setSupplierLoading(false); }
    const [r,c] = await Promise.allSettled([fetch("/api/supplier-rfqs"),fetch("/api/supplier-scorecards")]);
    if (r.status === "fulfilled" && r.value.ok) { const data = await r.value.json(); setRfqs(data.items ?? []); }
    if (c.status === "fulfilled" && c.value.ok) { const data = await c.value.json(); setScores(data.items ?? []); }
  }
  useEffect(() => { void Promise.resolve().then(() => refresh()); }, []);
  async function submit(url: string, data: Record<string, unknown>) {
    setMessage("");
    const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    const body=await r.json();
    setMessage(r.ok?"Đã lưu thành công.":body.message??"Không thể lưu.");
    if (r.ok) await refresh();
  }
  async function createSupplier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!entryName.trim() || entrySaving) return;
    setEntrySaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/production-suppliers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: entryName.trim(), phone: entryPhone.trim() || null, email: entryEmail.trim() || null, website: entryWebsite.trim() || null, sourceUrl: entrySource.trim() || null, contact: entryContact.trim() || null, notes: entryNotes.trim() || null, factoryAddress: entryAddress.trim() || null,
          capabilities: entryCapabilities.trim() || null, supplierType: entryType, verificationStatus: "UNVERIFIED", isActive: false }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Không thể lưu hồ sơ.");
      setEntryName(""); setEntryPhone(""); setEntryEmail(""); setEntryWebsite(""); setEntrySource(""); setEntryContact(""); setEntryNotes(""); setEntryAddress(""); setEntryCapabilities(""); setEntryType("UNKNOWN");
      setMessage("Đã lưu hồ sơ mới ở trạng thái chưa xác minh.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu hồ sơ.");
    } finally { setEntrySaving(false); }
  }
  const filteredSuppliers = suppliers.filter(s =>
    [s.name,s.code,s.phone ?? "",s.capabilities ?? ""].join(" ").toLocaleLowerCase("vi").includes(entrySearch.trim().toLocaleLowerCase("vi")));
  return <main className="mx-auto max-w-6xl space-y-8 p-6">
    <h1 className="text-2xl font-semibold">Quản lý nhà cung cấp · SRM</h1>
    <p className="text-sm text-gray-500">Bắt đầu bằng việc nhập hồ sơ xưởng. Các hồ sơ mới luôn được lưu ở trạng thái chưa xác minh; chỉ phê duyệt sau khi kiểm tra thực tế.</p>
    <section className="space-y-4 rounded-xl border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">1. Nhập nhà cung cấp mới</h2><Link href="/admin/production-suppliers" className="rounded border px-3 py-2 text-sm">Danh sách đầy đủ</Link></div>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>void createSupplier(e)}>
        <label className="text-sm">Tên nhà cung cấp *<input required className="mt-1 w-full rounded border p-2" value={entryName} onChange={e=>setEntryName(e.target.value)} placeholder="Ví dụ: Xưởng thú nhồi bông ABC"/></label>
        <label className="text-sm">Số điện thoại<input className="mt-1 w-full rounded border p-2" value={entryPhone} onChange={e=>setEntryPhone(e.target.value)} placeholder="Điện thoại liên hệ"/></label>
        <label className="text-sm">Người liên hệ<input className="mt-1 w-full rounded border p-2" value={entryContact} onChange={e=>setEntryContact(e.target.value)} placeholder="Tên phụ trách"/></label>
        <label className="text-sm">Email<input type="email" className="mt-1 w-full rounded border p-2" value={entryEmail} onChange={e=>setEntryEmail(e.target.value)} placeholder="email@company.com"/></label>
        <label className="text-sm">Website<input type="url" className="mt-1 w-full rounded border p-2" value={entryWebsite} onChange={e=>setEntryWebsite(e.target.value)} placeholder="https://example.com"/></label>
        <label className="text-sm">Nguồn tìm thấy xưởng<input type="url" className="mt-1 w-full rounded border p-2" value={entrySource} onChange={e=>setEntrySource(e.target.value)} placeholder="https://..."/></label>
        <label className="text-sm">Loại hình<select className="mt-1 w-full rounded border p-2" value={entryType} onChange={e=>setEntryType(e.target.value)}><option value="UNKNOWN">Chưa xác định</option><option value="DIRECT_MANUFACTURER">Xưởng sản xuất trực tiếp (chưa xác minh)</option><option value="TRADER">Đơn vị thương mại</option><option value="MIXED">Vừa sản xuất vừa thương mại</option><option value="SERVICE_PROVIDER">Dịch vụ</option></select></label>
        <label className="text-sm">Địa chỉ xưởng<input className="mt-1 w-full rounded border p-2" value={entryAddress} onChange={e=>setEntryAddress(e.target.value)} placeholder="Địa chỉ hoặc khu vực sản xuất"/></label>
        <label className="text-sm sm:col-span-2">Năng lực / sản phẩm có thể làm<textarea className="mt-1 w-full rounded border p-2" rows={2} value={entryCapabilities} onChange={e=>setEntryCapabilities(e.target.value)} placeholder="Thú nhồi bông, móc khóa plush, bao bì, MOQ..."/></label>
        <label className="text-sm sm:col-span-2">Ghi chú sourcing<textarea rows={2} className="mt-1 w-full rounded border p-2" value={entryNotes} onChange={e=>setEntryNotes(e.target.value)} placeholder="Nguồn tìm thấy, MOQ dự kiến, bước tiếp theo..."/></label>
        <div className="sm:col-span-2 flex items-center gap-3"><button disabled={entrySaving || !entryName.trim()} className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" type="submit">{entrySaving ? "Đang lưu..." : "Lưu nhà cung cấp"}</button><span className="text-sm text-gray-500">Có thể bổ sung email, website, tài liệu và ghi chú trong hồ sơ chi tiết.</span></div>
      </form>
    </section>
    <section className="space-y-3 rounded-xl border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">2. Nhà cung cấp đã lưu ({supplierLoading ? "Đang tải" : supplierError ? "Lỗi tải dữ liệu" : suppliers.length})</h2><Link href="/admin/production-suppliers" className="text-sm underline">Lọc và quản lý nâng cao</Link></div>
      {supplierError && <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800"><strong>Không tải được nhà cung cấp:</strong> {supplierError} <button className="ml-2 underline" type="button" onClick={()=>void refresh()}>Thử lại</button></div>}
      <input className="w-full rounded border p-2" placeholder="Tìm theo tên, mã, số điện thoại, năng lực..." value={entrySearch} onChange={e=>setEntrySearch(e.target.value)}/>
      <div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Nhà cung cấp</th><th className="p-2">Loại hình</th><th className="p-2">Xác minh</th><th className="p-2">Liên hệ</th><th className="p-2">Thao tác</th></tr></thead><tbody>{filteredSuppliers.map(s=><tr key={s.id} className="border-t"><td className="p-2"><strong>{s.name}</strong><div className="text-xs text-gray-500">{s.code}</div></td><td className="p-2">{s.supplierType === "DIRECT_MANUFACTURER" ? "Xưởng (chưa chắc đã xác minh)" : s.supplierType === "TRADER" ? "Thương mại" : s.supplierType ?? "Chưa phân loại"}</td><td className="p-2">{s.verificationStatus === "APPROVED" ? "Đã duyệt" : s.verificationStatus === "REJECTED" ? "Không đạt" : "Chưa phê duyệt"}</td><td className="p-2">{s.phone || "—"}</td><td className="p-2"><Link className="underline" href={`/admin/production-suppliers/${s.id}`}>Xem / sửa</Link></td></tr>)}</tbody></table>{!supplierLoading && !supplierError && filteredSuppliers.length === 0 && <p className="p-4 text-sm text-gray-500">Chưa có nhà cung cấp phù hợp.</p>}</div>
    </section>
    <p className="text-sm text-gray-500">Quản lý báo giá và đánh giá NCC. Thông tin thẩm định thực tế cần được xác nhận riêng trước khi phê duyệt.</p>
    <label className="block text-sm">Nhà cung cấp
      <select className="mt-1 w-full rounded border p-2" value={supplierId} onChange={e=>setSupplierId(e.target.value)}>
        <option value="">Chọn nhà cung cấp</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
      </select>
    </label>
    <section className="space-y-3"><h2 className="text-xl font-semibold">3. Yêu cầu báo giá (RFQ)</h2>
      <input className="w-full rounded border p-2" placeholder="Tên sản phẩm / yêu cầu báo giá" value={title} onChange={e=>setTitle(e.target.value)}/>
      <button className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" disabled={!supplierId||!title.trim()} onClick={()=>void submit("/api/supplier-rfqs",{supplierId,title})}>Tạo RFQ</button>
      <div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">NCC</th><th className="p-2">RFQ</th><th className="p-2">Trạng thái</th><th className="p-2">Báo giá</th><th className="p-2">MOQ</th><th className="p-2">Lead time (ngày)</th></tr></thead><tbody>{rfqs.map(r=><tr key={r.id} className="border-t"><td className="p-2">{r.supplier.name}</td><td className="p-2">{r.title}</td><td className="p-2">{r.status}</td><td className="p-2">{r.quotedPrice??"—"}</td><td className="p-2">{r.moq??"—"}</td><td className="p-2">{r.leadTimeDays??"—"}</td></tr>)}</tbody></table></div>
    </section>
    <section className="space-y-3"><h2 className="text-lg font-semibold">Cập nhật báo giá RFQ</h2>
      <select className="w-full rounded border p-2" value={quoteId} onChange={e=>setQuoteId(e.target.value)}><option value="">Chọn RFQ</option>{rfqs.map(r=><option key={r.id} value={r.id}>{r.supplier.name} · {r.title}</option>)}</select>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><input type="number" className="rounded border p-2" placeholder="Giá báo" value={quotePrice} onChange={e=>setQuotePrice(e.target.value)}/><input type="number" className="rounded border p-2" placeholder="MOQ" value={quoteMoq} onChange={e=>setQuoteMoq(e.target.value)}/><input type="number" className="rounded border p-2" placeholder="Lead time (ngày)" value={quoteLead} onChange={e=>setQuoteLead(e.target.value)}/><select className="rounded border p-2" value={quoteStatus} onChange={e=>setQuoteStatus(e.target.value)}>{["DRAFT","SENT","QUOTED","ACCEPTED","REJECTED","CLOSED"].map(s=><option key={s}>{s}</option>)}</select></div>
      <button className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" disabled={!quoteId} onClick={()=>void (async()=>{const response=await fetch(`/api/supplier-rfqs/${quoteId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:quoteStatus,...(quotePrice!==""?{quotedPrice:Number(quotePrice)}:{}),...(quoteMoq!==""?{moq:Number(quoteMoq)}:{}),...(quoteLead!==""?{leadTimeDays:Number(quoteLead)}:{})})}); const body=await response.json();setMessage(response.ok?"Đã cập nhật RFQ.":body.message??"Lỗi cập nhật.");if(response.ok)await refresh()})()}>Lưu báo giá</button>
    </section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">4. Đánh giá hiệu suất (chỉ dùng khi có dữ liệu thực tế)</h2>
      <div className="grid gap-2 sm:grid-cols-5"><label>Kỳ (YYYY-MM)<input className="w-full rounded border p-2" type="month" value={period} onChange={e=>setPeriod(e.target.value)}/></label>{([["Chất lượng",quality,setQuality],["Giao hàng",delivery,setDelivery],["Giá",price,setPrice],["Phản hồi",response,setResponse]] as const).map(([label,value,set])=><label key={label}>{label}<input type="number" min={0} max={100} className="w-full rounded border p-2" value={value} onChange={e=>set(e.target.value)}/></label>)}</div>
      <button className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" disabled={!supplierId} onClick={()=>void submit("/api/supplier-scorecards",{supplierId,period,qualityScore:Number(quality),deliveryScore:Number(delivery),priceScore:Number(price),responsivenessScore:Number(response)})}>Lưu điểm đánh giá</button>
      <div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">NCC</th><th className="p-2">Kỳ</th><th className="p-2">Tổng điểm</th><th className="p-2">Chất lượng</th><th className="p-2">Giao hàng</th><th className="p-2">Giá</th><th className="p-2">Phản hồi</th></tr></thead><tbody>{scores.map(s=><tr key={s.id} className="border-t"><td className="p-2">{s.supplier.name}</td><td className="p-2">{s.period}</td><td className="p-2 font-semibold">{s.weightedScore.toFixed(1)}</td><td className="p-2">{s.qualityScore}</td><td className="p-2">{s.deliveryScore}</td><td className="p-2">{s.priceScore}</td><td className="p-2">{s.responsivenessScore}</td></tr>)}</tbody></table></div>
    </section>
    {message?<p role="status" className="rounded border p-3">{message}</p>:null}
  </main>;
}
