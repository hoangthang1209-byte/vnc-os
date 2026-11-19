"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import Link from "next/link";
import s from "./ContractManager.module.css";
import {blankParty,standardClauses,type ContractParty,type ContractItem,type ContractClause,type PaymentMilestone,type ContractLanguage} from "@/features/documents/contract-fields";
type Entity={id:string;legalName:string;address:string|null;taxCode:string|null;legalRepresentativeName:string|null;legalRepresentativeTitle:string|null;bankAccounts:{id:string;bankName:string;accountNo:string;accountName:string;swift:string|null;currency:string|null}[]};
type Customer={id:string;name:string;legalName:string|null;address:string|null;taxCode:string|null;representativeName:string|null;representativeTitle:string|null};
type ListItem={id:string;contractNo:string;status:string;language:string;title:string;currency:string;grandTotal:string;createdAt:string;buyer:unknown};
type ContractForm={
 language:ContractLanguage;title:string;customerId:string;orderId:string;legalEntityId:string;bankAccountId:string;
 currency:string;seller:ContractParty;buyer:ContractParty;goods:ContractItem[];clauses:ContractClause[];
 paymentTerms:PaymentMilestone[];taxRate:number;signedDate:string;effectiveDate:string;deliveryDate:string;
 deliveryAddress:string;notes:string;
};
const today=()=>new Date().toISOString().slice(0,10);
const newForm=():ContractForm=>({
 language:"VI",title:"HỢP ĐỒNG MUA BÁN HÀNG HÓA",customerId:"",orderId:"",legalEntityId:"",bankAccountId:"",
 currency:"VND",seller:blankParty(),buyer:blankParty(),
 goods:[{description:"",specification:"",quantity:1,unit:"cái",unitPrice:0}],
 clauses:standardClauses("VI"),paymentTerms:[{label:"Đặt cọc",percent:50,due:"Sau khi ký hợp đồng"},{label:"Thanh toán còn lại",percent:50,due:"Theo biên bản giao nhận"}],
 taxRate:0,signedDate:today(),effectiveDate:"",deliveryDate:"",deliveryAddress:"",notes:""
});
function renderMoney(value:number,currency:string){return new Intl.NumberFormat(currency==="VND"?"vi-VN":"en-US",{maximumFractionDigits:currency==="VND"?0:2,minimumFractionDigits:currency==="VND"?0:2}).format(value)+" "+currency;}
function dateText(v:unknown){return typeof v==="string"&&v?new Date(v).toISOString().slice(0,10):"";}
export default function ContractManager(){
 const [form,setForm]=useState<ContractForm>(newForm);
 const [entities,setEntities]=useState<Entity[]>([]);
 const [customers,setCustomers]=useState<Customer[]>([]);
 const [contracts,setContracts]=useState<ListItem[]>([]);
 const [currentId,setCurrentId]=useState("");
 const [currentNo,setCurrentNo]=useState("");
 const [status,setStatus]=useState("DRAFT");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [orderQuery,setOrderQuery]=useState("");
 const [orders,setOrders]=useState<{id:string;orderNo:string;customerId:string|null}[]>([]);
 const patch=<K extends keyof ContractForm>(key:K,value:ContractForm[K])=>setForm(f=>({...f,[key]:value}));
 const patchParty=(key:"seller"|"buyer",field:keyof ContractParty,value:string)=>setForm(f=>({...f,[key]:{...f[key],[field]:value}}));
 const refresh=useCallback(async()=>{
  const r=await fetch("/api/admin/documents/contracts",{cache:"no-store"});
  const j=await r.json();if(!r.ok)throw new Error(j.error||"Không tải được dữ liệu hợp đồng.");
  setContracts(j.contracts||[]);setEntities(j.entities||[]);setCustomers(j.customers||[]);
 },[]);
 useEffect(()=>{refresh().catch(e=>setMessage(e instanceof Error?e.message:"Không thể tải dữ liệu."));},[refresh]);
 useEffect(()=>{if(orderQuery.trim().length<2){setOrders([]);return;}
  let active=true;
  fetch("/api/admin/documents/invoices/orders?q="+encodeURIComponent(orderQuery),{cache:"no-store"})
   .then(r=>r.ok?r.json():null).then(v=>{if(active)setOrders(v?.orders||[]);}).catch(()=>{});
  return()=>{active=false};
 },[orderQuery]);
 const subtotal=useMemo(()=>form.goods.reduce((sum,x)=>sum+(Number(x.quantity)||0)*(Number(x.unitPrice)||0),0),[form.goods]);
 const taxAmount=subtotal*(Number(form.taxRate)||0)/100;
 const total=subtotal+taxAmount;
 const canEdit=status==="DRAFT";
 const updateItem=(i:number,key:keyof ContractItem,value:string)=>setForm(f=>({...f,goods:f.goods.map((g,j)=>i===j?{...g,[key]:key==="quantity"||key==="unitPrice"?Number(value):value}:g)}));
 async function load(id:string){
  setBusy(true);try{
   const r=await fetch("/api/admin/documents/contracts/"+encodeURIComponent(id),{cache:"no-store"});
   const j=await r.json();if(!r.ok)throw new Error(j.error||"Không tải được hợp đồng.");
   const c=j.contract;
   const derivedTax=Number(c.subtotal)>0?Number(c.taxAmount)/Number(c.subtotal)*100:0;
   setForm({language:c.language==="EN"?"EN":"VI",title:c.title,
    customerId:c.customerId||"",orderId:c.orderId||"",legalEntityId:c.legalEntityId||"",
    bankAccountId:c.bankAccountId||"",currency:c.currency,seller:c.seller,buyer:c.buyer,
    goods:c.goods,clauses:c.clauses,paymentTerms:c.paymentTerms,
    taxRate:derivedTax,signedDate:dateText(c.signedDate),effectiveDate:dateText(c.effectiveDate),
    deliveryDate:dateText(c.deliveryDate),deliveryAddress:c.deliveryAddress||"",notes:c.notes||""});
   setCurrentId(c.id);setCurrentNo(c.contractNo);setStatus(c.status);
   setMessage("Đã mở hợp đồng "+c.contractNo+".");
   window.scrollTo({top:0,behavior:"smooth"});
  }catch(e){setMessage(e instanceof Error?e.message:"Lỗi đọc hợp đồng.");}finally{setBusy(false);}
 }
 async function save(){
  if(!canEdit){setMessage("Hợp đồng đã phát hành không thể chỉnh sửa.");return;}
  setBusy(true);try{
   const target=currentId?"/api/admin/documents/contracts/"+encodeURIComponent(currentId):"/api/admin/documents/contracts";
   const r=await fetch(target,{method:currentId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
   const j=await r.json();if(!r.ok)throw new Error(j.error||"Không thể lưu.");
   setCurrentId(j.id);setCurrentNo(j.contractNo);setStatus("DRAFT");setMessage("Đã lưu bản nháp "+j.contractNo+".");
   await refresh();
  }catch(e){setMessage(e instanceof Error?e.message:"Lưu thất bại.");}finally{setBusy(false);}
 }
 async function issue(){
  if(!currentId||!canEdit)return;
  if(!window.confirm("Phát hành hợp đồng "+currentNo+"? Nội dung sẽ bị khóa và PDF cuối không còn watermark DRAFT."))return;
  setBusy(true);try{
   const r=await fetch("/api/admin/documents/contracts/"+encodeURIComponent(currentId)+"/issue",{method:"POST"});
   const j=await r.json();if(!r.ok)throw new Error(j.error||"Không thể phát hành.");
   setStatus("ISSUED");setMessage("Đã phát hành "+j.contractNo+".");await refresh();
  }catch(e){setMessage(e instanceof Error?e.message:"Phát hành thất bại.");}finally{setBusy(false);}
 }
 const input=(label:string,value:string,onChange:(v:string)=>void,placeholder="",disabled=!canEdit)=>
  <div className={s.field}><label>{label}</label><input value={value} placeholder={placeholder} disabled={disabled} onChange={e=>onChange(e.target.value)}/></div>;
 const textarea=(label:string,value:string,onChange:(v:string)=>void,disabled=!canEdit)=>
  <div className={s.field}><label>{label}</label><textarea value={value} disabled={disabled} onChange={e=>onChange(e.target.value)}/></div>;
 const selectOptions=(label:string,value:string,onChange:(v:string)=>void,options:{value:string;label:string}[])=>
  <div className={s.field}><label>{label}</label><select disabled={!canEdit} value={value} onChange={e=>onChange(e.target.value)}>{options.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></div>;
 return <div className={s.root}>
  <div className={s.panel}>
   <div className={s.toolbar}>
    <button type="button" className={s.secondary} disabled={busy} onClick={()=>{setForm(newForm());setCurrentId("");setCurrentNo("");setStatus("DRAFT");setMessage("Đã mở form hợp đồng mới.");}}>+ Hợp đồng mới</button>
    <button type="button" className={s.primary} disabled={busy||!canEdit} onClick={()=>void save()}>{busy?"Đang xử lý...":currentId?"Lưu thay đổi":"Lưu bản nháp"}</button>
    {currentId&&canEdit&&<button type="button" className={s.secondary} disabled={busy} onClick={()=>void issue()}>Phát hành</button>}
    {currentId&&<a className={s.secondary} style={{textDecoration:"none"}} href={"/api/admin/documents/contracts/"+encodeURIComponent(currentId)+"/pdf"}>{status==="DRAFT"?"Tải PDF Draft":"Tải PDF hợp đồng"}</a>}
    <Link href="/admin/documents/invoices" className={s.secondary} style={{textDecoration:"none"}}>Invoice</Link>
   </div>
   {message&&<div className={s.warning} role="status">{message}</div>}
   <h2>{currentNo||"Hợp đồng mới"} <span className={status==="ISSUED"?s.state+" "+s.issued:s.state}>{status==="DRAFT"?"BẢN NHÁP":"ĐÃ PHÁT HÀNH"}</span></h2>
   <div className={s.cols}>
    {selectOptions("Ngôn ngữ",form.language,v=>setForm(f=>({...f,language:v as ContractLanguage,title:v==="EN"?"GOODS SALES AGREEMENT":"HỢP ĐỒNG MUA BÁN HÀNG HÓA",clauses:standardClauses(v as ContractLanguage)})),[{value:"VI",label:"Tiếng Việt"},{value:"EN",label:"English"}])}
    {selectOptions("Đơn vị tiền",form.currency,v=>patch("currency",v),["VND","USD","EUR"].map(v=>({value:v,label:v})))}
    <div className={s.full}>{input("Tên hợp đồng",form.title,v=>patch("title",v))}</div>
    {selectOptions("Pháp nhân bên bán",form.legalEntityId,v=>{
     const e=entities.find(x=>x.id===v);
     setForm(f=>({...f,legalEntityId:v,bankAccountId:"",seller:e?{...f.seller,name:e.legalName,address:e.address||"",taxId:e.taxCode||"",representative:e.legalRepresentativeName||"",title:e.legalRepresentativeTitle||"",bankName:"",accountName:"",accountNo:"",swift:""}:f.seller}));
    },[{value:"",label:"Chọn pháp nhân..."},...entities.map(x=>({value:x.id,label:x.legalName}))])}
    {selectOptions("Tài khoản nhận thanh toán",form.bankAccountId,v=>{
     const e=entities.find(x=>x.id===form.legalEntityId);
     const bank=e?.bankAccounts.find(x=>x.id===v);
     setForm(f=>({...f,bankAccountId:v,currency:bank?.currency||f.currency,
      seller:{...f.seller,bankName:bank?.bankName||"",accountName:bank?.accountName||"",accountNo:bank?.accountNo||"",swift:bank?.swift||""}}));
    },[{value:"",label:"Chọn tài khoản..."},...(entities.find(x=>x.id===form.legalEntityId)?.bankAccounts||[]).map(x=>({value:x.id,label:x.bankName+" · "+x.accountNo}))])}
    {selectOptions("Khách hàng",form.customerId,v=>{
     const c=customers.find(x=>x.id===v);
     setForm(f=>({...f,customerId:v,buyer:c?{...f.buyer,name:c.legalName||c.name,address:c.address||"",taxId:c.taxCode||"",representative:c.representativeName||"",title:c.representativeTitle||""}:f.buyer}));
    },[{value:"",label:"Chọn khách hàng..."},...customers.map(x=>({value:x.id,label:x.legalName||x.name}))])}
    <div className={s.full}>
     {input("Tìm đơn hàng (mã đơn / PO)",orderQuery,setOrderQuery,"Nhập tối thiểu 2 ký tự")}
     {orders.length>0&&<div className={s.row}>{orders.map(o=><button type="button" key={o.id} className={s.secondary} style={{margin:3}} onClick={()=>{
       setForm(f=>{
        const customer=customers.find(c=>c.id===o.customerId);
        return {...f,orderId:o.id,customerId:o.customerId||f.customerId,
         buyer:customer?{...f.buyer,name:customer.legalName||customer.name,address:customer.address||"",taxId:customer.taxCode||"",representative:customer.representativeName||"",title:customer.representativeTitle||""}:f.buyer};
       });setOrderQuery(o.orderNo);setOrders([]);
      }}>{o.orderNo}</button>)}</div>}
     {form.orderId&&<div className={s.small}>Đã liên kết Order ID: {form.orderId} <button type="button" className={s.secondary} onClick={()=>patch("orderId","")}>Bỏ liên kết</button></div>}
    </div>
   </div>
   <h3>BÊN A — BÊN MUA / BUYER</h3>
   <div className={s.cols}>
    {input("Tên công ty / Company",form.buyer.name,v=>patchParty("buyer","name",v))}
    {input("MST / Tax ID",form.buyer.taxId,v=>patchParty("buyer","taxId",v))}
    {input("Người đại diện",form.buyer.representative,v=>patchParty("buyer","representative",v))}
    {input("Chức danh",form.buyer.title,v=>patchParty("buyer","title",v))}
    <div className={s.full}>{textarea("Địa chỉ",form.buyer.address,v=>patchParty("buyer","address",v))}</div>
   </div>
   <h3>BÊN B — BÊN BÁN / SELLER</h3>
   <div className={s.cols}>
    {input("Tên pháp nhân",form.seller.name,v=>patchParty("seller","name",v))}
    {input("MST / Tax ID",form.seller.taxId,v=>patchParty("seller","taxId",v))}
    {input("Người đại diện",form.seller.representative,v=>patchParty("seller","representative",v))}
    {input("Chức danh",form.seller.title,v=>patchParty("seller","title",v))}
    <div className={s.full}>{textarea("Địa chỉ",form.seller.address,v=>patchParty("seller","address",v))}</div>
    {input("Ngân hàng",form.seller.bankName,v=>patchParty("seller","bankName",v))}
    {input("Số tài khoản",form.seller.accountNo,v=>patchParty("seller","accountNo",v))}
    {input("Tên người thụ hưởng",form.seller.accountName,v=>patchParty("seller","accountName",v))}
    {input("SWIFT",form.seller.swift,v=>patchParty("seller","swift",v))}
   </div>
   <h3>Điều 1. Danh mục hàng hóa</h3>
   {form.goods.map((g,i)=><div className={s.row} key={i}>
    <div className={s.cols}>
     <div className={s.full}>{input("Sản phẩm / Description",g.description,v=>updateItem(i,"description",v))}</div>
     <div className={s.full}>{textarea("Quy cách / Specification",g.specification,v=>updateItem(i,"specification",v))}</div>
     {input("Số lượng",String(g.quantity),v=>updateItem(i,"quantity",v))}
     {input("Đơn vị tính",g.unit,v=>updateItem(i,"unit",v))}
     {input("Đơn giá",String(g.unitPrice),v=>updateItem(i,"unitPrice",v))}
     <div className={s.summary}><span>Thành tiền</span><strong>{renderMoney(g.quantity*g.unitPrice,form.currency)}</strong></div>
    </div>
    {form.goods.length>1&&canEdit&&<button type="button" className={s.danger} onClick={()=>patch("goods",form.goods.filter((_,j)=>j!==i))}>Xóa dòng</button>}
   </div>)}
   <button type="button" disabled={!canEdit} className={s.secondary} onClick={()=>patch("goods",[...form.goods,{description:"",specification:"",quantity:1,unit:"pcs",unitPrice:0}])}>+ Thêm sản phẩm</button>
   <h3>Thanh toán và giao hàng</h3>
   <div className={s.cols}>
    {input("Thuế VAT (%)",String(form.taxRate),v=>patch("taxRate",Number(v)))}
    {input("Ngày ký (YYYY-MM-DD)",form.signedDate,v=>patch("signedDate",v))}
    {input("Ngày hiệu lực (tùy chọn)",form.effectiveDate,v=>patch("effectiveDate",v))}
    {input("Ngày giao hàng (tùy chọn)",form.deliveryDate,v=>patch("deliveryDate",v))}
    <div className={s.full}>{textarea("Địa điểm giao hàng",form.deliveryAddress,v=>patch("deliveryAddress",v))}</div>
   </div>
   {form.paymentTerms.map((p,i)=><div className={s.row} key={i}><div className={s.cols}>
    {input("Đợt thanh toán",p.label,v=>patch("paymentTerms",form.paymentTerms.map((x,j)=>i===j?{...x,label:v}:x)))}
    {input("Tỷ lệ (%)",String(p.percent),v=>patch("paymentTerms",form.paymentTerms.map((x,j)=>i===j?{...x,percent:Number(v)}:x)))}
    <div className={s.full}>{textarea("Thời hạn / Điều kiện",p.due,v=>patch("paymentTerms",form.paymentTerms.map((x,j)=>i===j?{...x,due:v}:x)))}</div>
   </div>{canEdit&&<button type="button" className={s.danger} onClick={()=>patch("paymentTerms",form.paymentTerms.filter((_,j)=>i!==j))}>Xóa đợt</button>}</div>)}
   <button type="button" className={s.secondary} disabled={!canEdit} onClick={()=>patch("paymentTerms",[...form.paymentTerms,{label:"",percent:0,due:""}])}>+ Thêm đợt thanh toán</button>
   <div className={s.warning}>Tổng tỷ lệ thanh toán: <strong>{form.paymentTerms.reduce((sum,p)=>sum+Number(p.percent),0)}%</strong> (bắt buộc bằng 100% trước khi lưu). Các điều khoản pháp lý dưới đây là mẫu có thể chỉnh sửa và cần được hai bên duyệt trước khi ký.</div>
   <h3>Điều khoản hợp đồng (tùy chỉnh)</h3>
   {form.clauses.map((c,i)=><div className={s.row} key={i}>
    {input("Tiêu đề điều khoản",c.heading,v=>patch("clauses",form.clauses.map((x,j)=>i===j?{...x,heading:v}:x)))}
    {textarea("Nội dung",c.body,v=>patch("clauses",form.clauses.map((x,j)=>i===j?{...x,body:v}:x)))}
    {canEdit&&<button type="button" className={s.danger} onClick={()=>patch("clauses",form.clauses.filter((_,j)=>i!==j))}>Xóa điều khoản</button>}
   </div>)}
   <button type="button" disabled={!canEdit} className={s.secondary} onClick={()=>patch("clauses",[...form.clauses,{heading:"",body:""}])}>+ Thêm điều khoản</button>
   <div style={{marginTop:16}}>{textarea("Ghi chú khác",form.notes,v=>patch("notes",v))}</div>
  </div>
  <div className={s.sticky}>
   <section className={s.panel}>
    <h2>Tổng quan hợp đồng</h2>
    <div className={s.small}>{form.title}</div>
    <div className={s.summary}><span>Bên mua</span><strong>{form.buyer.name||"Chưa chọn"}</strong></div>
    <div className={s.summary}><span>Bên bán</span><strong>{form.seller.name||"Chưa chọn"}</strong></div>
    <div className={s.summary}><span>Sản phẩm</span><strong>{form.goods.length}</strong></div>
    <div className={s.summary}><span>Trước thuế</span><strong>{renderMoney(subtotal,form.currency)}</strong></div>
    <div className={s.summary}><span>VAT ({form.taxRate}%)</span><strong>{renderMoney(taxAmount,form.currency)}</strong></div>
    <div className={s.summary+" "+s.total}><span>Tổng tiền</span><strong>{renderMoney(total,form.currency)}</strong></div>
    <div className={s.warning}>Hợp đồng này không phải chứng từ đã ký điện tử. Tải bản cuối để kiểm tra, ký và lưu bản ký theo quy trình của VNC.</div>
   </section>
   <section className={s.panel} style={{marginTop:16}}>
    <h2>Hợp đồng đã lưu</h2>
    {contracts.length===0?<p className={s.small}>Chưa có hợp đồng.</p>:contracts.map(c=><div className={s.item} key={c.id}>
     <div><strong>{c.contractNo}</strong><span>{c.title} · {c.currency} {c.grandTotal}</span></div>
     <div style={{textAlign:"right"}}><div className={c.status==="ISSUED"?s.state+" "+s.issued:s.state}>{c.status}</div>
      <button type="button" className={s.secondary} style={{marginTop:7}} disabled={busy} onClick={()=>void load(c.id)}>Mở</button>
     </div>
    </div>)}
   </section>
  </div>
 </div>;
}
