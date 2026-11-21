"use client";
import { useCallback, useEffect, useState } from "react";

type OrderItem = { id: string; sku: string; name: string; variants: Array<{ id: string; size: string }> };
type Carton = { id: string; orderItemId: string; cartonCode: string; quantity: number;
  marketCode: string | null; sizeSnapshot: string | null; status: "DRAFT" | "SEALED"; sealedAt: string | null };
export default function OrderPackingWorkspace({orderId, items}:{orderId:string; items:OrderItem[]}) {
  const [cartons,setCartons]=useState<Carton[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [form,setForm]=useState({orderItemId:items[0]?.id ?? "",orderItemVariantId:"",cartonCode:"",quantity:0,marketCode:"",sizeSnapshot:"",note:""});
  const load=useCallback(async()=>{
    const res=await fetch(`/api/orders/${orderId}/packing-cartons`);
    const body=await res.json();
    if(!res.ok)throw new Error(body.message??"Không tải được carton");
    setCartons(body.cartons??[]);
  },[orderId]);
  useEffect(()=>{let alive=true; queueMicrotask(()=>{if(!alive)return;
    void load().catch(e=>setError(e instanceof Error?e.message:"Lỗi tải")).finally(()=>setLoading(false));
  });return()=>{alive=false};},[load]);
  const item=items.find(i=>i.id===form.orderItemId);
  async function save(){
    setBusy(true);setError("");
    try{
      const res=await fetch(`/api/orders/${orderId}/packing-cartons`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,orderItemVariantId:form.orderItemVariantId||null})});
      const json=await res.json();if(!res.ok)throw new Error(json.message??"Không tạo được carton");
      await load();setForm(f=>({...f,cartonCode:"",quantity:0,note:""}));
    }catch(e){setError(e instanceof Error?e.message:"Không lưu được carton")}finally{setBusy(false)}
  }
  async function toggle(carton:Carton){
    setBusy(true);setError("");
    try{
      const res=await fetch(`/api/orders/${orderId}/packing-cartons/${carton.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({sealed:carton.status!=="SEALED"})});
      const json=await res.json();if(!res.ok)throw new Error(json.message??"Không xác nhận được carton");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Không xác nhận được carton")}finally{setBusy(false)}
  }
  return <section className="admin-panel" style={{display:"grid",gap:14}}>
    <div><h1 className="admin-title">Packing / Carton</h1><p className="admin-field-hint">Quản lý thùng theo SKU/size, chỉ cho phép seal trong số lượng QC đạt.</p></div>
    {error&&<p className="admin-error" role="alert">{error}</p>}
    <div className="admin-section-card" style={{display:"grid",gap:9}}>
      <h2 className="admin-subtitle">Thêm carton</h2>
      <label className="admin-label">SKU
        <select className="admin-input" value={form.orderItemId} onChange={e=>setForm(f=>({...f,orderItemId:e.target.value,orderItemVariantId:""}))}>
          {items.map(i=><option key={i.id} value={i.id}>{i.sku} · {i.name}</option>)}
        </select>
      </label>
      <label className="admin-label">Size / variant
        <select className="admin-input" value={form.orderItemVariantId} onChange={e=>setForm(f=>({...f,orderItemVariantId:e.target.value,sizeSnapshot:item?.variants.find(v=>v.id===e.target.value)?.size??""}))}>
          <option value="">Theo SKU</option>{(item?.variants??[]).map(v=><option key={v.id} value={v.id}>{v.size}</option>)}
        </select>
      </label>
      <label className="admin-label">Mã carton
        <input className="admin-input" value={form.cartonCode} onChange={e=>setForm(f=>({...f,cartonCode:e.target.value}))} placeholder="CTN-001"/>
      </label>
      <label className="admin-label">Số lượng trong carton
        <input className="admin-input" type="number" step={1} min={1} value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:Number(e.target.value)}))}/>
      </label>
      <label className="admin-label">Thị trường (nếu có)
        <input className="admin-input" value={form.marketCode} onChange={e=>setForm(f=>({...f,marketCode:e.target.value}))} placeholder="KUL / JKT / MNL / KHH"/>
      </label>
      <label className="admin-label">Ghi chú
        <textarea className="admin-input" rows={2} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
      </label>
      <button type="button" className="admin-btn admin-btn--primary" disabled={busy||!form.orderItemId||!form.cartonCode.trim()||!Number.isSafeInteger(form.quantity)||form.quantity<1} onClick={()=>void save()}>Tạo carton nháp</button>
    </div>
    <div className="admin-section-card">
      <h2 className="admin-subtitle">Danh sách carton · {cartons.length}</h2>
      {loading?<p>Đang tải…</p>:cartons.length===0?<p className="admin-field-hint">Chưa có carton.</p>:
      <div style={{display:"grid",gap:8}}>{cartons.map(c=><div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,borderBottom:"1px solid #e5e7eb",padding:"9px 0"}}>
        <div><strong>{c.cartonCode}</strong><p className="admin-field-hint">{items.find(i=>i.id===c.orderItemId)?.sku??"SKU"} · {c.sizeSnapshot||"—"} · {c.marketCode||"—"} · {c.quantity.toLocaleString("vi-VN")} pcs · {c.status}</p></div>
        <button type="button" className="admin-btn admin-btn--secondary admin-btn--small" disabled={busy} onClick={()=>void toggle(c)}>{c.status==="SEALED"?"Mở seal":"Xác nhận SEALED"}</button>
      </div>)}</div>}
    </div>
  </section>;
}
