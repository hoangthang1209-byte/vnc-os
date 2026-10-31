"use client";
import {useState} from "react";
import InvoiceIssuerPicker, {type IssuerSelection} from "@/components/admin/documents/InvoiceIssuerPicker";
export default function VncCompanyMasterData(){
 const [entityId,setEntityId]=useState("");
 const [bankId,setBankId]=useState("");
 return <section className="admin-form">
  <h2>Pháp nhân và tài khoản ngân hàng VNC</h2>
  <p>Quản lý nguồn dữ liệu chung cho Custom Invoice và chứng từ VNC OS. Tài khoản ngân hàng thuộc từng pháp nhân.</p>
  <InvoiceIssuerPicker selectedEntityId={entityId} selectedBankId={bankId} canManage onSelect={({entity,account}:IssuerSelection)=>{
   setEntityId(entity.id);setBankId(account?.id??"");
  }}/>
 </section>;
}
