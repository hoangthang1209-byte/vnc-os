"use client";
import { useState } from "react";
type Line={description:string;quantity:string;unit:string;unitPrice:string};
export default function CustomInvoicePage(){
 const [invoiceNo,setInvoiceNo]=useState("");const [recipientName,setRecipientName]=useState("");
 const [issuerName,setIssuerName]=useState("");const [currency,setCurrency]=useState("USD");
 const [issueDate,setIssueDate]=useState(new Date().toISOString().slice(0,10));
 const [lines,setLines]=useState<Line[]>([{description:"Sample development fee",quantity:"1",unit:"set",unitPrice:"0"}]);
 const [message,setMessage]=useState("");const [pdfId,setPdfId]=useState("");
 const [issued,setIssued]=useState(false);
 const [invoices,setInvoices]=useState<Array<{id:string;invoiceNo:string;status:string;recipientName:string;currency:string;total:string}>>([]);
 const [recipientAddress,setRecipientAddress]=useState("");const [issuerAddress,setIssuerAddress]=useState("");
 const [beneficiary,setBeneficiary]=useState("");const [bank,setBank]=useState("");const [bankAccount,setBankAccount]=useState("");const [swift,setSwift]=useState("");const [notes,setNotes]=useState("");
 const change=(index:number, key:keyof Line,value:string)=>setLines(rows=>rows.map((r,i)=>index===i?{...r,[key]:value}:r));
 async function refresh(){
  const response=await fetch("/api/admin/documents/invoices",{cache:"no-store"});
  if(response.ok){const data=await response.json();setInvoices(data.invoices??[]);}
 }

 async function issue(id:string){
  setMessage("Issuing invoice...");
  try {
   const response=await fetch(`/api/admin/documents/invoices/${encodeURIComponent(id)}/issue`,{method:"POST"});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error || "Unable to issue");
   setIssued(true);setMessage("Issued — final PDF available");void refresh();
  }catch(error){setMessage(error instanceof Error?error.message:"Unable to issue");}
 }
 async function save(){
  setMessage("Saving...");
  try{
   const response=await fetch("/api/admin/documents/invoices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({invoiceNo,recipientName,issuerName,currency,issueDate,lines,recipientAddress,issuerAddress,beneficiary,bank,bankAccount,swift,notes})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Save failed");
   setPdfId(data.id);setIssued(false);setMessage("Draft saved — issue before downloading final PDF");void refresh();
  }catch(error){setMessage(error instanceof Error?error.message:"Save failed");}
 }
 return <main style={{maxWidth:960,margin:"32px auto",padding:24}}>
  <h1 style={{fontSize:28,fontWeight:700}}>Custom Invoice — Payment Request</h1>
  <p>Commercial payment request; not a VAT invoice. No Order required.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16,marginTop:24}}>
   <label>Invoice No.<input value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} placeholder="CI-2026-0001" style={{display:"block",width:"100%",padding:10,border:"1px solid #ccc"}}/></label>
   <label>Issue date<input type="date" value={issueDate} onChange={e=>setIssueDate(e.target.value)} style={{display:"block",width:"100%",padding:10,border:"1px solid #ccc"}}/></label>
   <label>Issuer<input value={issuerName} onChange={e=>setIssuerName(e.target.value)} placeholder="Legal company name" style={{display:"block",width:"100%",padding:10,border:"1px solid #ccc"}}/></label>
   <label>Bill to<input value={recipientName} onChange={e=>setRecipientName(e.target.value)} placeholder="Customer company" style={{display:"block",width:"100%",padding:10,border:"1px solid #ccc"}}/></label>
   <label>Currency<select value={currency} onChange={e=>setCurrency(e.target.value)} style={{display:"block",padding:10}}><option>USD</option><option>VND</option><option>EUR</option></select></label>
  </div>
  <h2 style={{fontSize:20,fontWeight:600,marginTop:28}}>Addresses</h2>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16,marginTop:12}}>
   <label>Issuer address<input value={issuerAddress} onChange={e=>setIssuerAddress(e.target.value)} style={{display:"block",padding:10,width:"100%",border:"1px solid #ccc"}}/></label>
   <label>Customer address<input value={recipientAddress} onChange={e=>setRecipientAddress(e.target.value)} style={{display:"block",padding:10,width:"100%",border:"1px solid #ccc"}}/></label>
  </div>
  <h2 style={{fontSize:20,fontWeight:600,marginTop:28}}>Items</h2>
  {lines.map((line,i)=><div key={i} style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
    {(["description","quantity","unit","unitPrice"] as const).map(key=><input key={key} aria-label={key} placeholder={key} value={line[key]} onChange={e=>change(i,key,e.target.value)} style={{padding:9,border:"1px solid #bbb",flex:key==="description"?"3 1 180px":"1 1 90px"}}/>)}
    <button type="button" onClick={()=>setLines(rows=>rows.filter((_,n)=>n!==i))}>Remove</button>
  </div>)}
  <button type="button" style={{marginTop:12}} onClick={()=>setLines(rows=>[...rows,{description:"",quantity:"1",unit:"pcs",unitPrice:"0"}])}>+ Add item</button>
  <h2 style={{fontSize:20,fontWeight:600,marginTop:28}}>Payment details</h2>
  <p>Use only verified company bank details; no sample account is prefilled.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginTop:12}}>
    {([{name:"Beneficiary",value:beneficiary,set:setBeneficiary},{name:"Bank",value:bank,set:setBank},{name:"Bank account",value:bankAccount,set:setBankAccount},{name:"SWIFT",value:swift,set:setSwift}]).map(field=><label key={field.name}>{field.name}<input value={field.value} onChange={e=>field.set(e.target.value)} style={{display:"block",padding:10,width:"100%",border:"1px solid #ccc"}}/></label>)}
  </div>
  <label style={{display:"block",marginTop:16}}>Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} style={{display:"block",padding:10,width:"100%",border:"1px solid #ccc"}}/></label>
  <div style={{marginTop:24,display:"flex",gap:12}}>
   <button type="button" onClick={save} style={{padding:"12px 20px",background:"#111",color:"white",borderRadius:6}}>Save Invoice</button>
   {pdfId&&!issued&&<button type="button" onClick={()=>void issue(pdfId)} style={{padding:"12px 20px",background:"#b91c1c",color:"white",borderRadius:6}}>Issue invoice</button>}
   {pdfId&&issued&&<a href={`/api/admin/documents/invoices/${encodeURIComponent(pdfId)}/pdf`} style={{padding:12,border:"1px solid #999",borderRadius:6}}>Download final PDF</a>}
  </div>
  <p role="status" style={{marginTop:12}}>{message}</p>
  <section style={{marginTop:32}}>
    <h2 style={{fontSize:20,fontWeight:600}}>Saved invoices</h2>\n    <button type="button" onClick={()=>void refresh()} style={{margin:"8px 0",padding:8,border:"1px solid #ccc"}}>Refresh saved invoices</button>
    {invoices.map(invoice=><div key={invoice.id} style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #ddd"}}>
      <span style={{flex:"1 1 220px"}}>{invoice.invoiceNo} · {invoice.recipientName} · {invoice.currency} {invoice.total} · {invoice.status}</span>
      {invoice.status==="DRAFT"&&<button type="button" onClick={()=>void issue(invoice.id)}>Issue</button>}
      {invoice.status==="ISSUED"&&<a href={`/api/admin/documents/invoices/${encodeURIComponent(invoice.id)}/pdf`}>Download PDF</a>}
    </div>)}
  </section>
 </main>;
}
