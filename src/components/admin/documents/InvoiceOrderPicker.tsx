"use client";
import { useEffect, useState } from "react";
import s from "./CustomInvoiceManager.module.css";

export type InvoiceOrderOption={
 id:string;orderNo:string;customerPoNo:string|null;customerId:string|null;currency:string;
 customerCompanyName:string|null;customerNameSnapshot:string|null;customerLegalNameSnapshot:string|null;
 customerAddress:string|null;customerEmailSnapshot:string|null;
 customer:{id:string;name:string;legalName:string|null;email:string|null;address:string|null}|null;
};
type Props={selectedId:string;onSelect:(order:InvoiceOrderOption|null)=>void;disabled?:boolean};
export default function InvoiceOrderPicker({selectedId,onSelect,disabled}:Props){
 const [query,setQuery]=useState("");
 const [results,setResults]=useState<InvoiceOrderOption[]>([]);
 const [selected,setSelected]=useState<InvoiceOrderOption|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{
  if(query.trim().length<2||selectedId)return;
  const controller=new AbortController();
  const timer=setTimeout(async()=>{
   setLoading(true);
   try{
    const response=await fetch("/api/admin/documents/invoices/orders?q="+encodeURIComponent(query.trim()),{cache:"no-store",signal:controller.signal});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"Không tìm được đơn hàng.");
    setResults(data.orders??[]);setError("");
   }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Không tìm được đơn hàng.");}
   finally{if(!controller.signal.aborted)setLoading(false);}
  },250);
  return ()=>{clearTimeout(timer);controller.abort();};
 },[query,selectedId]);
 return <div className={s.customerPicker}>
  <div className={s.customerPickerTop}><label htmlFor="invoice-order-search">Liên kết đơn hàng VNC OS (không bắt buộc)</label>
   {selectedId&&<button type="button" className={s.customerTextButton} disabled={disabled} onClick={()=>{setSelected(null);setQuery("");setResults([]);onSelect(null);}}>Bỏ liên kết</button>}
  </div>
  <input className={s.input} id="invoice-order-search" type="search" value={query} disabled={disabled}
   placeholder="Tìm theo mã đơn hàng, PO hoặc tên khách hàng..."
   onChange={e=>{setQuery(e.target.value);setResults([]);setError("");if(selectedId){setSelected(null);onSelect(null);}}}/>
  {selectedId&&selected&&<p className={s.customerSelected}>✓ Đã liên kết {selected.orderNo} · PO: {selected.customerPoNo||"—"} · {selected.currency}</p>}
  {loading&&<p className={s.customerHint}>Đang tìm đơn hàng...</p>}
  {query.trim().length>=2&&!loading&&results.length>0&&<div className={s.customerResults} role="listbox" aria-label="Danh sách đơn hàng">
   {results.map(o=><button type="button" className={s.customerResult} key={o.id} onClick={()=>{
    setSelected(o);setQuery(o.orderNo);setResults([]);onSelect(o);
   }}><strong>{o.orderNo} {o.customerPoNo&&"· PO "+o.customerPoNo}</strong>
    <small>{o.customerLegalNameSnapshot||o.customerCompanyName||o.customer?.legalName||o.customer?.name||"Chưa có khách hàng"} · {o.currency}</small>
   </button>)}
  </div>}
  {error&&<p className={s.customerError} role="alert">{error}</p>}
  <p className={s.customerHint}>Invoice vẫn có thể được lập độc lập. Liên kết đơn hàng chỉ dùng để truy xuất, đối chiếu và tự điền thông tin; không tự thay đổi giá trị thanh toán.</p>
 </div>;
}
