"use client";
import { useEffect, useState } from "react";
import s from "./CustomInvoiceManager.module.css";
export type VncBankInfo={id:string;legalEntityId:string;accountName:string;accountNo:string;accountAddress:string|null;bankName:string;bankAddress:string|null;branch:string|null;swift:string|null;currency:string|null;isActive:boolean;isDefault:boolean};
export type VncIssuerInfo={id:string;code:string;legalName:string;address:string|null;taxCode:string|null;email:string|null;phone:string|null;isActive:boolean;isDefault:boolean;bankAccounts:VncBankInfo[]};
export type IssuerSelection={entity:VncIssuerInfo;account:VncBankInfo|null};
type Props={onSelect:(value:IssuerSelection)=>void;selectedEntityId:string;selectedBankId:string;canManage:boolean;disabled?:boolean};
const emptyBank=()=>({accountName:"",accountNo:"",accountAddress:"",bankName:"",bankAddress:"",branch:"",swift:"",currency:"USD"});
export default function InvoiceIssuerPicker({onSelect,selectedEntityId,selectedBankId,canManage,disabled}:Props){
 const [entities,setEntities]=useState<VncIssuerInfo[]>([]);
 const [editing,setEditing]=useState<""|"entity"|"bank">("");
 const [entityDraft,setEntityDraft]=useState({code:"",legalName:"",address:"",taxCode:"",email:"",phone:""});
 const [bankDraft,setBankDraft]=useState(emptyBank());
 const [editId,setEditId]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const current=entities.find(x=>x.id===selectedEntityId);
 async function refresh(){
  try{const res=await fetch("/api/admin/documents/invoices/issuers",{cache:"no-store"});
   const data=await res.json();if(!res.ok)throw new Error(data.error||"Không tải được danh mục.");
   setEntities(data.legalEntities??[]);
  }catch(e){setError(e instanceof Error?e.message:"Không tải được dữ liệu.");}
 }
 useEffect(()=>{void refresh();},[]);
 async function submit(){
  setBusy(true);setError("");
  const kind=editing;
  const body=kind==="entity"?{kind,...entityDraft}:{kind,legalEntityId:selectedEntityId,...bankDraft};
  try{
   const res=await fetch("/api/admin/documents/invoices/issuers",{
    method:editId?"PATCH":"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(editId?{...body,id:editId}:body)
   });
   const data=await res.json();if(!res.ok)throw new Error(data.error||"Lưu không thành công");
   setEditing("");setEditId("");setEntityDraft({code:"",legalName:"",address:"",taxCode:"",email:"",phone:""});setBankDraft(emptyBank());
   await refresh();
   if(kind==="entity"&&data.entity){
    onSelect({entity:{...data.entity,bankAccounts:[]},account:null});
   }else if(kind==="bank"&&data.account&&current){
    onSelect({entity:current,account:data.account});
   }
  }catch(e){setError(e instanceof Error?e.message:"Không lưu được.");}
  finally{setBusy(false);}
 }
 const input=(label:string,value:string,change:(x:string)=>void,required=false)=><div className={s.field}><label>{label}{required?" *":""}</label><input className={s.input} value={value} onChange={e=>change(e.target.value)} disabled={busy} /></div>;
 const account=current?.bankAccounts.find(x=>x.id===selectedBankId);
 return <div className={s.issuerSection}>
  <div className={s.customerPickerTop}><label>Pháp nhân phát hành · VNC</label>{canManage&&<button className={s.customerTextButton} type="button" disabled={disabled} onClick={()=>{setEditing("entity");setEditId("");setError("");}}>+ Thêm pháp nhân</button>}</div>
  <select className={s.select} value={selectedEntityId} disabled={disabled} onChange={e=>{
   const entity=entities.find(x=>x.id===e.target.value);if(entity)onSelect({entity,account:null});
  }}><option value="">Chọn pháp nhân của VNC...</option>{entities.filter(x=>x.isActive||x.id===selectedEntityId).map(x=><option value={x.id} key={x.id}>{x.legalName} ({x.code})</option>)}</select>
  {current&&<div className={s.issuerBrief}><strong>{current.legalName}</strong><div>{current.address||"Chưa có địa chỉ pháp lý"} · MST: {current.taxCode||"Chưa cập nhật"}</div>{canManage&&<button className={s.customerTextButton} type="button" onClick={()=>{setEditing("entity");setEditId(current.id);setEntityDraft({code:current.code,legalName:current.legalName,address:current.address||"",taxCode:current.taxCode||"",email:current.email||"",phone:current.phone||""});}}>Chỉnh sửa pháp nhân</button>}</div>}
  <div className={s.customerPickerTop} style={{marginTop:14}}><label>Tài khoản ngân hàng nhận thanh toán</label>{canManage&&current&&<button className={s.customerTextButton} type="button" disabled={disabled} onClick={()=>{setEditing("bank");setEditId("");setBankDraft(emptyBank());setError("");}}>+ Thêm tài khoản</button>}</div>
  <select className={s.select} value={selectedBankId} disabled={disabled||!current} onChange={e=>{
   if(!current)return;const bank=current.bankAccounts.find(x=>x.id===e.target.value)||null;onSelect({entity:current,account:bank});
  }}><option value="">Chọn tài khoản ngân hàng...</option>{current?.bankAccounts.filter(x=>x.isActive||x.id===selectedBankId).map(a=><option key={a.id} value={a.id}>{a.currency||"—"} · {a.bankName} · {a.accountNo}</option>)}</select>
  {account&&<div className={s.issuerBrief}><strong>{account.accountName}</strong><div>{account.bankName} · {account.branch||"Chưa có chi nhánh"}</div><div>{account.currency} · {account.accountNo} · {account.swift||"Không có SWIFT"}</div><div>Account address: {account.accountAddress||"Chưa cập nhật"}</div><div>Bank address: {account.bankAddress||"Chưa cập nhật"}</div>{canManage&&<button type="button" className={s.customerTextButton} onClick={()=>{setEditing("bank");setEditId(account.id);setBankDraft({accountName:account.accountName,accountNo:account.accountNo,accountAddress:account.accountAddress||"",bankName:account.bankName,bankAddress:account.bankAddress||"",branch:account.branch||"",swift:account.swift||"",currency:account.currency||"USD"});}}>Chỉnh sửa tài khoản</button>}</div>}
  {editing&&canManage&&<div className={s.customerCreate}><div className={s.customerPickerTop}><strong>{editId?"Cập nhật":"Tạo mới"} {editing==="entity"?"pháp nhân":"tài khoản ngân hàng"}</strong><button type="button" className={s.customerTextButton} onClick={()=>{setEditing("");setEditId("");}}>Đóng</button></div>
   {editing==="entity"?<div className={s.fields}>{input("Mã pháp nhân",entityDraft.code,x=>setEntityDraft(p=>({...p,code:x})),!editId)}{input("Tên pháp lý",entityDraft.legalName,x=>setEntityDraft(p=>({...p,legalName:x})),true)}{input("Địa chỉ pháp lý",entityDraft.address,x=>setEntityDraft(p=>({...p,address:x})))}{input("Mã số thuế",entityDraft.taxCode,x=>setEntityDraft(p=>({...p,taxCode:x})))}{input("Email",entityDraft.email,x=>setEntityDraft(p=>({...p,email:x})))}{input("Điện thoại",entityDraft.phone,x=>setEntityDraft(p=>({...p,phone:x})))}</div>
   :<div className={s.fields}>
    {input("Account Number",bankDraft.accountNo,x=>setBankDraft(p=>({...p,accountNo:x})),true)}
    {input("Currency",bankDraft.currency,x=>setBankDraft(p=>({...p,currency:x})),true)}
    {input("Account Name",bankDraft.accountName,x=>setBankDraft(p=>({...p,accountName:x})),true)}
    {input("Account Address",bankDraft.accountAddress,x=>setBankDraft(p=>({...p,accountAddress:x})))}
    {input("Bank Name",bankDraft.bankName,x=>setBankDraft(p=>({...p,bankName:x})),true)}
    {input("Bank Address",bankDraft.bankAddress,x=>setBankDraft(p=>({...p,bankAddress:x})))}
    {input("Branch",bankDraft.branch,x=>setBankDraft(p=>({...p,branch:x})))}
    {input("SWIFT/BIC",bankDraft.swift,x=>setBankDraft(p=>({...p,swift:x})))}
   </div>}
   <button type="button" className={s.primary} onClick={()=>void submit()} disabled={busy}>{busy?"Đang lưu...":"Lưu thông tin"}</button>
  </div>}
  {error&&<p className={s.customerError} role="alert">{error}</p>}
 </div>;
}
