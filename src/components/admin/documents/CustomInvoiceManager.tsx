"use client";
import { useEffect, useState } from "react";
import { useAdminPermissions } from "@/components/admin/AdminPermissionsContext";
import s from "./CustomInvoiceManager.module.css";
import InvoiceCustomerPicker, { customerInvoiceFields, type InvoiceCrmCustomer } from "./InvoiceCustomerPicker";
import InvoiceIssuerPicker, { type IssuerSelection } from "./InvoiceIssuerPicker";
import InvoiceOrderPicker, { type InvoiceOrderOption } from "./InvoiceOrderPicker";
import { VNC_LOGO_PNG_DATA_URI } from "@/features/documents/vnc-invoice-brand";
import { isValidInvoiceNumericInput } from "@/features/documents/custom-invoice-calculation";
type Line={description:string;quantity:string;unit:string;unitPrice:string};
type SavedInvoice={id:string;invoiceNo:string;status:string;recipientName:string;currency:string;total:string;createdAt:string;createdByDisplayName:string;createdByMode:string;preparedByName:string|null};
const blank=():Line=>({description:"",quantity:"1",unit:"pcs",unitPrice:"0"});
const amount=(n:string,currency:string)=>new Intl.NumberFormat("en-US",{minimumFractionDigits:currency==="VND"?0:2,maximumFractionDigits:currency==="VND"?0:2}).format(Number(n)||0);
export default function CustomInvoiceManager(){
 const {permissions}=useAdminPermissions();
 const [invoiceNo,setInvoiceNo]=useState("");
 const [recipientName,setRecipientName]=useState("");
 const [customerId,setCustomerId]=useState("");
 const [orderId,setOrderId]=useState("");
 const [preparedByName,setPreparedByName]=useState("");
 const [recipientEmail,setRecipientEmail]=useState("");
 const [recipientAddress,setRecipientAddress]=useState("");
 const [issuerName,setIssuerName]=useState("");
 const [issuerAddress,setIssuerAddress]=useState("");
 const [issuerTaxId,setIssuerTaxId]=useState("");
 const [legalEntityId,setLegalEntityId]=useState("");
 const [bankAccountId,setBankAccountId]=useState("");
 const [currency,setCurrency]=useState("USD");
 const [issueDate,setIssueDate]=useState(new Date().toISOString().slice(0,10));
 const [dueDate,setDueDate]=useState("");
 const [lines,setLines]=useState<Line[]>([{description:"Sample development fee",quantity:"1",unit:"set",unitPrice:"0"}]);
 const [beneficiary,setBeneficiary]=useState("");
 const [bank,setBank]=useState("");
 const [bankAccount,setBankAccount]=useState("");
 const [accountAddress,setAccountAddress]=useState("");
 const [bankAddress,setBankAddress]=useState("");
 const [branch,setBranch]=useState("");
 const [swift,setSwift]=useState("");
 const [notes,setNotes]=useState("");
 const [discount,setDiscount]=useState("0");
 const [extraCharge,setExtraCharge]=useState("0");
 const [tax,setTax]=useState("0");
 const [pdfId,setPdfId]=useState("");
 const [issued,setIssued]=useState(false);
 const [invoices,setInvoices]=useState<SavedInvoice[]>([]);
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const setLine=(index:number,key:keyof Line,value:string)=>{setPdfId("");setIssued(false);setLines(rows=>rows.map((r,i)=>index===i?{...r,[key]:value}:r));};
 const sum=lines.reduce((n,l)=>n+(Number(l.quantity)||0)*(Number(l.unitPrice)||0),0);
 const estimated=sum-(Number(discount)||0)+(Number(extraCharge)||0)+(Number(tax)||0);
 async function refresh(){
  try{const r=await fetch("/api/admin/documents/invoices",{cache:"no-store"});if(r.ok){const data=await r.json();setInvoices(data.invoices??[]);}}catch{}
 }
 useEffect(()=>{
  let mounted=true;
  fetch("/api/admin/documents/invoices",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{if(mounted&&data)setInvoices(data.invoices??[]);}).catch(()=>{});
  return ()=>{mounted=false};
 },[]);
 async function save(){
  if(!invoiceNo.trim()||!issuerName.trim()||!recipientName.trim()){setMessage("Vui lòng nhập số Invoice, tên bên phát hành và tên khách hàng.");return;}
  const blankLine=lines.findIndex(line=>!line.description.trim());
  if(blankLine>=0){setMessage("Khoản thu "+(blankLine+1)+" chưa có nội dung. Hãy nhập mô tả hoặc xóa khoản thu này.");return;}
  const numeric=[...lines.flatMap(line=>[line.quantity,line.unitPrice]),discount,extraCharge,tax];
  const wrong=numeric.find(value=>!isValidInvoiceNumericInput(value));
  if(wrong!==undefined){setMessage("Giá trị số '"+wrong+"' không hợp lệ. Ví dụ 20 thay vì 020; không dùng dấu phẩy.");return;}
  if(swift.trim()&&!/^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/.test(swift.trim())){setMessage("SWIFT/BIC gồm 8 hoặc 11 ký tự, khác với số tài khoản. Nếu không có hãy để trống.");return;}
  setBusy(true);setMessage("Đang lưu bản nháp...");
  try{
   const r=await fetch("/api/admin/documents/invoices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({invoiceNo,customerId:customerId||null,orderId:orderId||null,legalEntityId:legalEntityId||null,bankAccountId:bankAccountId||null,recipientName,recipientAddress,recipientEmail,issuerName,issuerAddress,issuerTaxId,currency,issueDate,dueDate,lines,beneficiary,bank,bankAccount,accountAddress,bankAddress,branch,swift,notes,discount,extraCharge,tax})});
   const data=await r.json();if(!r.ok)throw new Error(data.error||"Không thể lưu bản nháp");
   setPdfId(data.id);setIssued(false);setMessage("Đã lưu bản nháp "+data.invoiceNo+".");await refresh();
  }catch(error){setMessage(error instanceof Error?error.message:"Lưu không thành công");}
  finally{setBusy(false);}
 }
 async function issue(id:string){
  if(!window.confirm("Phát hành sẽ khóa nội dung Invoice. Bạn xác nhận thông tin và tài khoản ngân hàng đã chính xác?"))return;
  setBusy(true);setMessage("Đang phát hành Invoice...");
  try{
   const r=await fetch("/api/admin/documents/invoices/"+encodeURIComponent(id)+"/issue",{method:"POST"});
   const data=await r.json();if(!r.ok)throw new Error(data.error||"Không thể phát hành");
   if(id===pdfId)setIssued(true);setMessage("Invoice đã phát hành. Có thể tải PDF.");await refresh();
  }catch(error){setMessage(error instanceof Error?error.message:"Phát hành không thành công");}
  finally{setBusy(false);}
 }
 const field=(label:string,value:string,change:(v:string)=>void,placeholder="",type="text")=><div className={s.field}><label>{label}</label><input className={s.input} type={type} value={value} placeholder={placeholder} onChange={e=>{change(e.target.value);setPdfId("");setIssued(false);}}/></div>;
 return <main className={s.workspace}>
  <div className={s.toolbar}>
   <div><p className={s.eyebrow}>DOCUMENT CENTER / TÀI CHÍNH</p><h1 className={s.heading}>Tạo yêu cầu thanh toán</h1><p className={s.muted}>Commercial Invoice · Phí làm mẫu, phát triển sản phẩm và các khoản thu khác</p></div>
   <span className={s.pill}>{issued?"● Đã phát hành":"○ Bản nháp"}</span>
  </div>
  <div className={s.layout}>
   <section className={s.panel}>
    <div className={s.panelHead}><h2>Thông tin chứng từ</h2><span className={s.pill}>Không cần liên kết đơn hàng</span></div>
    <div className={s.body}>
     <div className={s.section}><p className={s.sectionTitle}>01 / Thông tin cơ bản</p><div className={s.fields3}>
      {field("Số Invoice *",invoiceNo,setInvoiceNo,"CI-2026-0001")}
      {field("Ngày phát hành",issueDate,setIssueDate,"","date")}
      <div className={s.field}><label>Loại tiền</label><select className={s.select} value={currency} onChange={e=>{setCurrency(e.target.value);setPdfId("");}}><option>USD</option><option>VND</option><option>EUR</option></select></div>
      {field("Hạn thanh toán",dueDate,setDueDate,"","date")}
     </div></div>
     <div className={s.section}><p className={s.sectionTitle}>02 / Liên kết đơn hàng (tuỳ chọn)</p>
      <InvoiceOrderPicker selectedId={orderId} disabled={busy} onSelect={(order:InvoiceOrderOption|null)=>{
       setOrderId(order?.id||"");
       setPreparedByName(order?.salesEmployee?.fullName||order?.salesRepresentative?.fullName||order?.salesName||"");
       if(order){
        setCurrency(order.currency);
        const c=order.customer;
        setCustomerId(order.customerId||c?.id||"");
        setRecipientName(order.customerLegalNameSnapshot||order.customerCompanyName||c?.legalName||order.customerNameSnapshot||c?.name||"");
        setRecipientAddress(order.customerAddress||c?.address||"");
        setRecipientEmail(order.customerEmailSnapshot||c?.email||"");
        setMessage("Đã liên kết đơn hàng "+order.orderNo+". Kiểm tra số tiền trước khi lưu; Invoice không tự lấy tổng đơn hàng.");
       }else setMessage("Đã bỏ liên kết đơn hàng.");
       setPdfId("");setIssued(false);
      }}/>
     </div>
     <div className={s.section}><p className={s.sectionTitle}>03 / Bên phát hành và khách hàng</p><div className={s.field}><label>Prepared By / Sales Account phụ trách</label><input className={s.input} readOnly value={preparedByName||"Chưa xác định — chọn đơn hàng có Sales/Account phụ trách"} aria-label="Sales Account phụ trách Invoice theo đơn hàng" /></div>
      <InvoiceCustomerPicker selectedId={customerId} disabled={busy} onClear={()=>setCustomerId("")} onSelect={(customer:InvoiceCrmCustomer)=>{
       const fields=customerInvoiceFields(customer);
       setCustomerId(customer.id);setRecipientName(fields.recipientName);setRecipientAddress(fields.recipientAddress);setRecipientEmail(fields.recipientEmail);
       setPdfId("");setIssued(false);setMessage("");
      }}/>
      <InvoiceIssuerPicker selectedEntityId={legalEntityId} selectedBankId={bankAccountId}
       canManage={permissions.canIssueCustomInvoice} disabled={busy}
       onSelect={({entity,account}:IssuerSelection)=>{
        setLegalEntityId(entity.id);setIssuerName(entity.legalName);setIssuerAddress(entity.address||"");setIssuerTaxId(entity.taxCode||"");
        setBankAccountId(account?.id||"");setBeneficiary(account?.accountName||"");setBank(account?.bankName||"");
        setBankAccount(account?.accountNo||"");setAccountAddress(account?.accountAddress||"");
        setBankAddress(account?.bankAddress||"");setBranch(account?.branch||"");setSwift(account?.swift||"");
        if(account?.currency)setCurrency(account.currency);
        setPdfId("");setIssued(false);
       }}/>
      <div className={s.fields}>
      {field("Đơn vị phát hành *",issuerName,v=>{setIssuerName(v);setLegalEntityId("");setBankAccountId("");},"Tên pháp nhân VNC")}
      {field("Khách hàng *",recipientName,v=>{setRecipientName(v);setCustomerId("");},"Tên công ty / cá nhân")}
      {field("Địa chỉ bên phát hành",issuerAddress,setIssuerAddress,"Địa chỉ pháp lý")}
      {field("Địa chỉ khách hàng",recipientAddress,setRecipientAddress,"Địa chỉ nhận Invoice")}
     </div></div>
     <div className={s.section}><p className={s.sectionTitle}>04 / Chi tiết khoản thu</p>
      {lines.map((l,i)=><div className={s.item} key={i}><div className={s.itemTop}><span className={s.itemIndex}>Khoản thu {String(i+1).padStart(2,"0")}</span><button type="button" className={s.ghost} disabled={lines.length===1} onClick={()=>{setLines(rows=>rows.filter((_,j)=>j!==i));setPdfId("");}}>Xóa khoản thu</button></div>
       <div className={s.fields3}>
        <div className={s.field+" "+s.full}><label>Nội dung khoản thu</label><input className={s.input} value={l.description} onChange={e=>setLine(i,"description",e.target.value)} placeholder="Ví dụ: Sample development fee"/></div>
        {(["quantity","unit","unitPrice"] as const).map((key,j)=><div className={s.field} key={key}><label>{["Số lượng","Đơn vị","Đơn giá"][j]}</label><input className={s.input} value={l[key]} onChange={e=>setLine(i,key,e.target.value)} /></div>)}
       </div>
      </div>)}
      <button className={s.add} type="button" onClick={()=>{setLines(rows=>[...rows,blank()]);setPdfId("");}}>+ Thêm khoản thu</button>
      <div className={s.fields3} style={{marginTop:14}}>{field("Giảm trừ",discount,setDiscount,"0")}{field("Phụ phí",extraCharge,setExtraCharge,"0")}{field("Thuế / phí khác",tax,setTax,"0")}</div>
      <p className={s.helper}>Tổng tiền bên phải chỉ là ước tính trên giao diện. Số tiền chính thức được tính và kiểm tra lại trên máy chủ khi lưu.</p>
     </div>
     <div className={s.section}><p className={s.sectionTitle}>05 / Thông tin thanh toán</p><div className={s.fields}>
      {field("Tên người thụ hưởng",beneficiary,setBeneficiary,"Tên trên tài khoản ngân hàng")}
      {field("Ngân hàng",bank,setBank,"Tên ngân hàng")}
      {field("Số tài khoản",bankAccount,setBankAccount,"Tài khoản đã xác minh")}
      {field("SWIFT (nếu có)",swift,setSwift,"")}
      {field("Account Address",accountAddress,setAccountAddress,"Địa chỉ chủ tài khoản")}
      {field("Bank Address",bankAddress,setBankAddress,"Địa chỉ ngân hàng")}
      {field("Branch",branch,setBranch,"Chi nhánh ngân hàng")}
      <div className={s.field+" "+s.full}><label>Ghi chú / điều khoản</label><textarea className={s.textarea} value={notes} onChange={e=>{setNotes(e.target.value);setPdfId("");}} placeholder="Điều khoản thanh toán, nội dung chuyển khoản..."/></div>
     </div></div>
    </div>
    <div className={s.actions}>
     <button className={s.primary} type="button" disabled={busy||!permissions.canCreateCustomInvoice} onClick={()=>void save()}>{busy?"Đang xử lý...":"Lưu bản nháp"}</button>
     {pdfId&&!issued&&permissions.canIssueCustomInvoice&&<button className={s.secondary} type="button" disabled={busy} onClick={()=>void issue(pdfId)}>Phát hành Invoice</button>}
     {pdfId&&issued&&<a className={s.secondary} href={"/api/admin/documents/invoices/"+encodeURIComponent(pdfId)+"/pdf"}>Tải PDF</a>}
    </div>
    <p role="status" className={s.status}>{message}</p>
   </section>
   <aside className={s.previewWrap}><div className={s.panel}>
    <div className={s.panelHead}><h2>Xem trước Invoice</h2><span className={s.pill}>A4 · Minh họa</span></div>
    <div className={s.paperOuter}><div className={s.paper}>
     <div className={s.paperHeader}>
       <div className={s.paperBrand}>
        {/* Official VNC logo, bundled as a trusted image asset. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={VNC_LOGO_PNG_DATA_URI} alt="Vietnam Clothing Manufacturing" className={s.paperLogo}/>
       </div>
       <div className={s.paperTitleBlock}>
        <div className={s.paperTitle}>COMMERCIAL<br/>INVOICE</div>
        <div className={s.paperSubtitle}>PAYMENT REQUEST</div>
       </div>
     </div>
     <div className={s.paperParties}>
      <div className={s.paperParty}><div className={s.paperCaption}>ISSUED BY</div><div className={s.paperPartyName}>{issuerName||"Vietnam Clothing Manufacturing"}</div><div className={s.paperPartyAddress}>{issuerAddress||"Ho Chi Minh City, Vietnam"}</div></div>
      <div className={s.paperParty}><div className={s.paperCaption}>BILL TO</div><div className={s.paperPartyName}>{recipientName||"Customer name"}</div><div className={s.paperPartyAddress}>{recipientAddress||"Customer address"}</div></div>
     </div>
     <div className={s.paperMetaEnterprise}>
      {([{label:"INVOICE NUMBER",value:invoiceNo||"—"},{label:"ISSUE DATE",value:issueDate||"—"},{label:"DUE DATE",value:dueDate||"—"}]).map(meta=><div className={s.paperMetaCell} key={meta.label}><span className={s.paperCaption}>{meta.label}</span><strong>{meta.value}</strong></div>)}
     </div>
     <div className={s.paperTableTitle}>INVOICE ITEMS</div>
     <table className={s.paperTable}><thead><tr><th>DESCRIPTION</th><th className={s.right}>QTY</th><th>UNIT</th><th className={s.right}>UNIT PRICE</th><th className={s.right}>AMOUNT</th></tr></thead><tbody>
      {lines.map((l,i)=><tr key={i}><td>{l.description||"—"}</td><td className={s.right}>{l.quantity}</td><td>{l.unit}</td><td className={s.right}>{amount(l.unitPrice,currency)}</td><td className={s.right}>{amount(String((Number(l.quantity)||0)*(Number(l.unitPrice)||0)),currency)}</td></tr>)}
     </tbody></table>
     <div className={s.paperFinancials}><div className={s.paperSubtotal}><span>Subtotal</span><span>{currency} {amount(String(sum),currency)}</span></div>{Number(discount)>0&&<div className={s.paperSubtotal}><span>Discount</span><span>− {currency} {amount(discount,currency)}</span></div>}{Number(extraCharge)>0&&<div className={s.paperSubtotal}><span>Additional charges</span><span>{currency} {amount(extraCharge,currency)}</span></div>}{Number(tax)>0&&<div className={s.paperSubtotal}><span>Tax / other charges</span><span>{currency} {amount(tax,currency)}</span></div>}<div className={s.total}><span>TOTAL AMOUNT DUE</span><span>{currency} {amount(String(estimated),currency)}</span></div></div>
     <div className={s.paperBank}><div className={s.paperTableTitle}>BANK TRANSFER INSTRUCTIONS</div><div className={s.paperBankGrid}><div className={s.paperCaption}>BENEFICIARY</div><div>{beneficiary||"—"}</div><div className={s.paperCaption}>BANK</div><div>{bank||"—"}</div><div className={s.paperCaption}>ACCOUNT NUMBER</div><div>{bankAccount||"—"}</div>{accountAddress&&<><div className={s.paperCaption}>ACCOUNT ADDRESS</div><div>{accountAddress}</div></>}{bankAddress&&<><div className={s.paperCaption}>BANK ADDRESS</div><div>{bankAddress}</div></>}{branch&&<><div className={s.paperCaption}>BRANCH</div><div>{branch}</div></>}{swift&&<><div className={s.paperCaption}>SWIFT / BIC</div><div>{swift}</div></>}</div></div>
     {notes&&<div className={s.paperNotes}><div className={s.paperTableTitle}>PAYMENT TERMS & NOTES</div><div>{notes}</div></div>}
     <div className={s.paperFooter}>Commercial payment request only. This document is not a Vietnamese VAT e-invoice.</div>
    </div></div>
   </div><p className={s.helper}>Đây là bản xem trước theo dữ liệu đang nhập, không phải Invoice đã lưu. Khi sửa khoản thu, cần lưu lại bằng số Invoice mới; PDF chỉ phản ánh bản đã phát hành và khóa dữ liệu.</p></aside>
  </div>
  <section className={s.panel+" "+s.listPanel}><div className={s.panelHead}><h2>Invoice đã lưu</h2><button type="button" className={s.secondary} onClick={()=>void refresh()}>Làm mới danh sách</button></div>
   {invoices.length===0?<p className={s.empty}>Chưa có Invoice nào được tải. Tạo bản nháp để bắt đầu.</p>:invoices.map(inv=><div className={s.listRow} key={inv.id}><div><div className={s.listMain}>{inv.invoiceNo} · {inv.recipientName}</div><div className={s.listSub}>{inv.currency} {inv.total} · Sales/Account: {inv.preparedByName||"Chưa xác định"} · Tạo bởi: {inv.createdByDisplayName} · {new Date(inv.createdAt).toLocaleString("vi-VN")}</div></div><div className={s.listActions}><span className={inv.status==="ISSUED"?s.state+" "+s.stateIssued:s.state}>{inv.status==="ISSUED"?"Đã phát hành":"Bản nháp"}</span>{inv.status==="DRAFT"&&permissions.canIssueCustomInvoice&&<button type="button" className={s.link} onClick={()=>void issue(inv.id)}>Phát hành</button>}{inv.status==="ISSUED"&&<a className={s.link} href={"/api/admin/documents/invoices/"+encodeURIComponent(inv.id)+"/pdf"}>Tải PDF</a>}</div></div>)}
  </section>
 </main>;
}
