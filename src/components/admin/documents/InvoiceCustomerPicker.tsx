"use client";
import { useEffect, useState } from "react";
import s from "./CustomInvoiceManager.module.css";

export type InvoiceCrmCustomer={
 id:string;code?:string|null;name:string;legalName?:string|null;
 address?:string|null;addressLine1?:string|null;addressLine2?:string|null;
 email?:string|null;taxCode?:string|null;
};
type Props={onSelect:(customer:InvoiceCrmCustomer)=>void;selectedId:string;disabled?:boolean};
function displayName(customer:InvoiceCrmCustomer){return customer.legalName?.trim()||customer.name;}
function displayAddress(customer:InvoiceCrmCustomer){
 return customer.address?.trim()||[customer.addressLine1,customer.addressLine2].filter(Boolean).join(", ");
}
export function customerInvoiceFields(customer:InvoiceCrmCustomer){
 return {recipientName:displayName(customer),recipientAddress:displayAddress(customer)||"",recipientEmail:customer.email||""};
}
export default function InvoiceCustomerPicker({onSelect,selectedId,disabled}:Props){
 const [query,setQuery]=useState("");
 const [results,setResults]=useState<InvoiceCrmCustomer[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [quickOpen,setQuickOpen]=useState(false);
 const [name,setName]=useState("");
 const [address,setAddress]=useState("");
 const [email,setEmail]=useState("");
 const [saving,setSaving]=useState(false);
 useEffect(()=>{
  if(query.trim().length<2){return;}
  const controller=new AbortController();
  const timer=setTimeout(async()=>{
   setLoading(true);
   try{
    const response=await fetch("/api/admin/documents/invoices/customers?q="+encodeURIComponent(query.trim()),{cache:"no-store",signal:controller.signal});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"Không tìm được khách hàng.");
    setResults(data.customers??[]);setError("");
   }catch(err){
    if(controller.signal.aborted)return;
    setError(err instanceof Error?err.message:"Không thể tìm khách hàng.");
   }finally{if(!controller.signal.aborted)setLoading(false);}
  },250);
  return ()=>{clearTimeout(timer);controller.abort();};
 },[query]);
 async function create(){
  if(!name.trim()){setError("Vui lòng nhập tên khách hàng.");return;}
  setSaving(true);setError("");
  try{
   const response=await fetch("/api/admin/documents/invoices/customers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name.trim(),address:address.trim(),email:email.trim()})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Không thể tạo khách hàng.");
   const customer=data.customer as InvoiceCrmCustomer;
   onSelect(customer);setQuery(displayName(customer));setResults([]);setQuickOpen(false);
   setName("");setAddress("");setEmail("");
  }catch(err){setError(err instanceof Error?err.message:"Không thể tạo khách hàng.");}
  finally{setSaving(false);}
 }
 return <div className={s.customerPicker}>
  <div className={s.customerPickerTop}>
   <label htmlFor="invoice-customer-search">Liên kết khách hàng CRM</label>
   <button type="button" className={s.customerTextButton} onClick={()=>setQuickOpen(open=>!open)} disabled={disabled}>{quickOpen?"Đóng":"+ Tạo nhanh khách hàng"}</button>
  </div>
  <input id="invoice-customer-search" className={s.input} type="search" value={query}
   placeholder="Tìm theo tên, mã khách hàng hoặc email..." disabled={disabled}
   onChange={event=>{setQuery(event.target.value);setResults([]);setError("");}}/>
  {selectedId&&<p className={s.customerSelected}>✓ Đã liên kết CRM · Khách hàng được lưu cùng Invoice</p>}
  {loading&&<p className={s.customerHint}>Đang tìm trong CRM...</p>}
  {!loading&&query.trim().length>=2&&results.length>0&&<div className={s.customerResults} role="listbox" aria-label="Khách hàng CRM">
   {results.map(customer=><button type="button" key={customer.id} className={s.customerResult}
    onClick={()=>{onSelect(customer);setQuery(displayName(customer));setResults([]);setError("");}} disabled={disabled}>
    <strong>{displayName(customer)}</strong>
    <small>{customer.code||"CRM"} · {displayAddress(customer)||customer.email||"Chưa có địa chỉ"}</small>
   </button>)}
  </div>}
  {quickOpen&&<div className={s.customerCreate}>
   <strong>Tạo khách hàng mới trong CRM</strong>
   <p className={s.customerHint}>Khách hàng được tạo trong hệ thống CRM chung, không chỉ trong Invoice.</p>
   <div className={s.fields}>
    <div className={s.field}><label>Tên công ty / khách hàng *</label><input className={s.input} value={name} maxLength={250} onChange={e=>setName(e.target.value)} /></div>
    <div className={s.field}><label>Email</label><input className={s.input} value={email} type="email" maxLength={250} onChange={e=>setEmail(e.target.value)} /></div>
    <div className={s.field+" "+s.full}><label>Địa chỉ xuất Invoice</label><input className={s.input} value={address} maxLength={1000} onChange={e=>setAddress(e.target.value)} /></div>
   </div>
   <button type="button" className={s.primary} disabled={saving||disabled} onClick={()=>void create()}>{saving?"Đang tạo...":"Tạo và chọn khách hàng"}</button>
  </div>}
  {error&&<p className={s.customerError} role="alert">{error}</p>}
 </div>;
}
